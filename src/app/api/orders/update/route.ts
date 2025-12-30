import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase';
import { logger } from '@/lib/logger';
import { validateRouteRole } from '@/lib/auth-server';
import { AppError } from '@/lib/errors';
import { logAdminAction } from '@/lib/audit-logger';
import { headers } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    const decodedToken = await validateRouteRole(req, ['admin', 'staff']);

    const body = await req.json().catch(() => ({}));
    const {
      id,
      status: rawNextStatus,
      transactionId,
      notes,
      confirmAction,
      decisionType, // Requerido para formalizar la acción
      reason, // Motivo de la decisión humana
    } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios (id)' },
        { status: 400 }
      );
    }

    const orderRef = adminDb.collection('orders').doc(id);
    const orderSnap = await orderRef.get();

    if (!orderSnap.exists) {
      return NextResponse.json(
        { error: 'Pedido no encontrado' },
        { status: 404 }
      );
    }

    const currentOrder = orderSnap.data() || {};
    let currentStatus = (currentOrder.status || 'CREATED').toUpperCase();

    // Normalizado de estados legados
    if (currentStatus === 'PENDING' || currentStatus === 'PENDING_VERIFICATION')
      currentStatus = 'WAITING_PAYMENT';

    const isManualChange = rawNextStatus && rawNextStatus !== currentStatus;

    // 0️⃣ GOBERNANZA DEL SISTEMA (Modo Día Negro)
    const {
      getSystemMode,
      isActionAllowed,
      generateCorrelationId,
    } = require('@/lib/system-governance');
    const systemMode = await getSystemMode();
    const correlationId = generateCorrelationId();

    if (
      !isActionAllowed(systemMode, 'ORDER_STATUS_OVERRIDE') &&
      isManualChange
    ) {
      return NextResponse.json(
        {
          error: 'Acceso Denegado: Modo de Emergencia Activo',
          message:
            'El sistema se encuentra en un estado de protección crítica y no permite cambios manuales en este momento.',
        },
        { status: 403 }
      );
    }

    // 1️⃣ GUARDRAILS: Bloqueo de errores humanos (MANDATO-FILTRO)

    // Inmutabilidad de estados terminales
    const terminalStatuses = [
      'DELIVERED',
      'CANCELLED',
      'CANCELLED_TIMEOUT',
      'REFUNDED',
      'RETURNED',
    ];
    if (terminalStatuses.includes(currentStatus)) {
      return NextResponse.json(
        {
          error: `El pedido está en estado terminal (${currentStatus}) y es inmutable.`,
        },
        { status: 400 }
      );
    }

    // Regla de las 24 horas y nivel de acceso
    const createdAt = currentOrder.createdAt
      ? new Date(currentOrder.createdAt).getTime()
      : Date.now();
    const isOldOrder = Date.now() - createdAt > 24 * 60 * 60 * 1000;

    // Simulación de validación de nivel de acceso (SuperAdmin/Owner)
    // En un sistema real, esto leería los custom claims del decodedToken
    const isSuperAdmin = decodedToken.role === 'admin';

    if (isOldOrder && !isSuperAdmin) {
      return NextResponse.json(
        {
          error: 'Acceso Restringido',
          message:
            'Los pedidos con más de 24h de antigüedad solo pueden ser modificados por un SuperAdministrador.',
        },
        { status: 403 }
      );
    }

    // 2️⃣ FORMALIZACIÓN DE DECISIÓN (Anti-Caos)
    if (isManualChange && (!reason || reason.length < 5)) {
      return NextResponse.json(
        {
          error:
            'Toda decisión manual debe formalizarse con un motivo válido (mínimo 5 caracteres).',
        },
        { status: 400 }
      );
    }

    const nextStatus = rawNextStatus?.toUpperCase();

    // 3️⃣ FSM & DOBLE CONFIRMACIÓN (Ya implementado, mantenemos lógica)
    const {
      canTransition,
      requiresDoubleConfirmation,
      PENDING_ACTION_TTL_MS,
    } = require('@/lib/order-lifecycle');

    if (nextStatus && nextStatus !== currentStatus) {
      if (!canTransition(currentStatus, nextStatus)) {
        return NextResponse.json(
          {
            error: 'Transición de estado inválida',
            message: `No es posible pasar de ${currentStatus} a ${nextStatus} directamente.`,
          },
          { status: 400 }
        );
      }

      // 2️⃣ DOBLE CONFIRMACIÓN (MANDATO-FILTRO)
      if (requiresDoubleConfirmation(nextStatus) && !confirmAction) {
        const pendingAction = {
          type: 'STATUS_CHANGE',
          targetStatus: nextStatus,
          expiresAt: Date.now() + PENDING_ACTION_TTL_MS,
        };

        await orderRef.update({ pendingAction });

        return NextResponse.json({
          confirmationRequired: true,
          message: `La acción '${nextStatus}' requiere doble confirmación.`,
          expiresIn: '5 minutos',
        });
      }

      if (confirmAction) {
        const pending = currentOrder.pendingAction;
        if (
          !pending ||
          pending.targetStatus !== nextStatus ||
          Date.now() > pending.expiresAt
        ) {
          return NextResponse.json(
            { error: 'Confirmación inválida o expirada' },
            { status: 400 }
          );
        }
      }

      // 3️⃣ REGLA DE NEGOCIO: Conciliación financiera
      if (
        nextStatus === 'PAID_VERIFIED' &&
        !transactionId &&
        !currentOrder.transactionId
      ) {
        return NextResponse.json(
          {
            error:
              'Se requiere un código de transacción para verificar el pago',
          },
          { status: 400 }
        );
      }
    }

    // 4️⃣ EJECUCIÓN ATÓMICA (Transacción)
    const { FieldValue } = require('@/lib/firebase');

    const sanitizedUpdates: any = {
      status: nextStatus || currentStatus,
      updatedAt: new Date().toISOString(),
      updatedBy: decodedToken.uid,
      pendingAction: FieldValue.delete(),
    };

    if (transactionId) sanitizedUpdates.transactionId = transactionId;
    if (notes) sanitizedUpdates.notes = notes;
    if (nextStatus === 'DELIVERED' && currentStatus !== 'DELIVERED') {
      sanitizedUpdates.deliveredAt = sanitizedUpdates.updatedAt;
    }

    const historyItem = {
      at: Date.now(),
      from: currentStatus,
      to: nextStatus || currentStatus,
      by: 'admin',
      userId: decodedToken.uid,
      reason: reason || 'Acción automática/estándar',
      type: decisionType || 'OVERRIDE_ESTADO',
      correlationId: correlationId,
    };

    // Usamos transacción para asegurar que la decisión se guarde junto al pedido
    await adminDb.runTransaction(async (transaction: any) => {
      // 1. Crear documento en manual_decisions si es cambio manual
      if (isManualChange) {
        const decisionRef = adminDb.collection('manual_decisions').doc();
        transaction.set(decisionRef, {
          orderId: id,
          type: decisionType || 'OVERRIDE_ESTADO',
          reason: reason,
          operatorId: decodedToken.uid,
          at: Date.now(),
          previousStatus: currentStatus,
          newStatus: nextStatus,
          correlationId: correlationId,
        });
      }

      // 2. Actualizar pedido
      transaction.update(orderRef, {
        ...sanitizedUpdates,
        history: FieldValue.arrayUnion(historyItem),
      });
    });

    // 5️⃣ AUDITORÍA FORENSE (MANDATO-FILTRO)
    const headersList = await headers();
    await logAdminAction({
      actorId: decodedToken.uid,
      action: 'ORDER_STATUS_CHANGE',
      targetId: id,
      before: { status: currentStatus },
      after: { status: nextStatus || currentStatus, ...sanitizedUpdates },
      reason: reason || 'Acción operativa estándar',
      correlationId: correlationId,
      ip: headersList.get('x-forwarded-for') || 'unknown',
      userAgent: headersList.get('user-agent') || 'unknown',
      metadata: { systemMode },
    });

    return NextResponse.json({
      success: true,
      status: nextStatus || currentStatus,
      correlationId,
    });
  } catch (e: any) {
    const isAppError = e instanceof AppError;
    const statusCode = isAppError ? e.statusCode : 500;
    const message = isAppError ? e.message : 'Error al actualizar el pedido';

    logger.error('Unexpected error in order update', { error: e.message || e });
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
