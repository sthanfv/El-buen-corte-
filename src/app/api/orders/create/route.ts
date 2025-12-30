import { NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase';
import { OrderSchema } from '@/schemas/order';
import { headers } from 'next/headers';
import { logger } from '@/lib/logger';
import { processOrderEvent } from '@/lib/events-handler';
import { orderRateLimit, redis } from '@/lib/ratelimit';
import {
  AppError,
  ValidationError,
  AuthenticationError,
  RateLimitError,
} from '@/lib/errors';
import { validateAndSanitize } from '@/lib/validation';

export async function POST(req: Request) {
  try {
    const headersList = await headers();
    const ip = headersList.get('x-forwarded-for') || 'unknown';
    const authHeader = headersList.get('Authorization');

    // 1. Rate Limiting Check (Distributed via Redis)
    let rateLimitResult = { success: true, limit: 0, reset: 0, remaining: 0 };
    try {
      rateLimitResult = await orderRateLimit.limit(ip);
    } catch (error) {
      logger.error('Rate limit service failure (Fail-Open active)', {
        ip,
        error,
      });
    }

    if (!rateLimitResult.success) {
      throw new RateLimitError(
        'Has superado el límite de pedidos permitidos por hora. Por favor, contacta a soporte.'
      );
    }

    // 2. Security Check: Verify Firebase Auth (Anonymous or Signed-in)
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthenticationError('Sesión no válida para realizar el pedido');
    }
    const token = authHeader.split('Bearer ')[1];
    try {
      await adminAuth.verifyIdToken(token);
    } catch (e) {
      throw new AuthenticationError('Sesión no válida');
    }

    const body = await req.json();

    // ✅ HONEYPOT DETECTION (MANDATO-FILTRO)
    // Si un bot llenó el campo oculto 'business_fax', lo atrapamos silenciosamente.
    if (body.business_fax) {
      logger.warn('Honeypot triggered: Bot detected (business_fax)', {
        ip,
        userAgent: headersList.get('user-agent'),
      });

      // Bloqueo persistente en Firestore (MANDATO-FILTRO)
      await adminDb
        .collection('blacklist')
        .doc(ip)
        .set({
          reason: 'Honeypot Triggered (business_fax)',
          blockedAt: new Date().toISOString(),
          userAgent: headersList.get('user-agent'),
          type: 'BOT_AUTOMATION',
        });

      // ✅ BLOQUEO EN CALIENTE (REDIS) para el middleware
      if (process.env.UPSTASH_REDIS_REST_URL) {
        await redis.set(`blacklist_${ip}`, 'true', { ex: 60 * 60 * 24 * 30 }); // Bloqueo por 30 días
      }

      // Devolvemos "éxito" falso para que el bot crea que ganó y no intente otras rutas.
      return NextResponse.json({
        ok: true,
        id: 'fake_ord_' + Math.random().toString(36).slice(2, 10),
      });
    }

    // 3. Validate and Sanitize Input (FASE 2)
    const validatedOrder = validateAndSanitize(OrderSchema, body);

    // ✅ ESTRATEGIA DE INGENIERÍA: TRANSACCIÓN ATÓMICA ACID (MANDATO-FILTRO)
    // Garantiza que no vendamos carne que ya no existe por condiciones de carrera.
    const result = await adminDb.runTransaction(async (transaction) => {
      // A. Verificar Idempotencia
      const idempotencyKey = body.idempotencyKey;
      if (idempotencyKey) {
        const existingOrderQuery = adminDb
          .collection('orders')
          .where('idempotencyKey', '==', idempotencyKey)
          .limit(1);
        const existingOrderSnap = await transaction.get(existingOrderQuery);
        if (!existingOrderSnap.empty) {
          return { duplicate: true, id: existingOrderSnap.docs[0].id };
        }
      }

      // B. Verificar y Actualizar Inventario para cada producto
      for (const item of validatedOrder.items) {
        const productRef = adminDb.collection('products').doc(item.id);
        const productSnap = await transaction.get(productRef);

        if (!productSnap.exists) {
          throw new ValidationError(
            `Producto ${item.name} no encontrado en inventario.`
          );
        }

        const currentStock = productSnap.data()?.stock || 0;
        // Para asados, el stock suele ser por unidades o por kg.
        // Implementamos resta por unidad (1 item = 1 resta de stock) para simplificar según exigencia.
        if (currentStock < 1) {
          throw new ValidationError(
            `Lo siento, el ${item.name} se ha agotado mientras realizabas tu pedido.`
          );
        }

        // Restar 1 unidad del stock físico
        transaction.update(productRef, {
          stock: currentStock - 1,
          updatedAt: new Date().toISOString(),
        });
      }

      // C. Calcular Total Seguro (Server-Side)
      const calculatedTotal = validatedOrder.items.reduce(
        (sum, item) => sum + item.finalPrice,
        0
      );

      // D. Crear Orden
      const orderRef = adminDb.collection('orders').doc();
      const orderData = {
        ...validatedOrder,
        total: calculatedTotal,
        idempotencyKey: body.idempotencyKey || null,
        estimatedCycleDays: validatedOrder.items.some(
          (i) => i.selectedWeight >= 3
        )
          ? 7
          : 15,
        reminded: false,
        _source: 'api',
        createdAt: new Date().toISOString(),
        status: 'WAITING_PAYMENT',
        expiresAt: Date.now() + 60 * 60 * 1000, // 1 hora
        customerIp: ip,
        source: body.source || 'direct',
      };

      transaction.set(orderRef, orderData);

      return { ok: true, id: orderRef.id, orderData };
    });

    if (result.duplicate) {
      logger.warn('Duplicate order attempt detected (Idempotency)', {
        idempotencyKey: body.idempotencyKey,
        ip,
      });
      return NextResponse.json({ ok: true, id: result.id, duplicate: true });
    }

    // 4. Rate limit counter is handled automatically by Upstash

    // ✅ DESACOPLAMIENTO: El usuario recibe respuesta inmediata.
    // Las tareas pesadas (Email, Analítica, Notificaciones) ocurren en background.
    // Usamos void para disparar y no esperar, o Next.js 'after' si está disponible.
    processOrderEvent({
      type: 'ORDER_CREATED',
      payload: { orderId: result.id, orderData: result.orderData },
    }).catch((e) => logger.error('Error en Background Processor Trigger', e));

    logger.info('Order created successfully with ACID Transaction', {
      orderId: result.id,
      ip,
    });
    return NextResponse.json({ ok: true, id: result.id });
  } catch (e: any) {
    // ✅ MANEJO CENTRALIZADO DE ERRORES (MANDATO-FILTRO)
    const isAppError = e instanceof AppError;
    const statusCode = isAppError ? e.statusCode : 500;
    const message = isAppError
      ? e.message
      : 'Ha ocurrido un error inesperado. Por favor, contacta a soporte.';

    logger.error('API Error: /api/orders/create', {
      error: e.message || e,
      code: isAppError ? e.code : 'UNKNOWN_ERROR',
      ip: (await headers()).get('x-forwarded-for') || 'unknown',
    });

    if (e.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Datos de pedido inválidos.', details: e.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
