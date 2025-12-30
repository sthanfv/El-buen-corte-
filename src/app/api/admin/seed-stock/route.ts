import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase';
import { validateRouteRole } from '@/lib/auth-server';
import { AppError } from '@/lib/errors';
import { logger } from '@/lib/logger';

/**
 * API: /api/admin/seed-stock
 * Inicializa el stock de los productos para la fase de integridad ACID.
 * Protocolo: MANDATO-FILTRO.
 */
export async function POST(req: NextRequest) {
  try {
    await validateRouteRole(req, ['admin']);

    const snapshot = await adminDb.collection('products').get();
    const batch = adminDb.batch();

    snapshot.docs.forEach((doc) => {
      // Asignamos un stock de 10 unidades por defecto para demo
      batch.update(doc.ref, {
        stock: 10,
        updatedAt: new Date().toISOString(),
      });
    });

    await batch.commit();

    logger.audit('Inventario inicializado (Seed Stock)', {
      count: snapshot.size,
    });
    return NextResponse.json({
      success: true,
      message: `Stock actualizado para ${snapshot.size} productos.`,
    });
  } catch (e: any) {
    const isAppError = e instanceof AppError;
    const statusCode = isAppError ? e.statusCode : 500;
    const message = isAppError ? e.message : 'Internal Server Error';

    logger.error('Error in seed-stock', e);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
