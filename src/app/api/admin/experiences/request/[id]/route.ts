import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase';
import { logger } from '@/lib/logger';
import { validateRouteRole } from '@/lib/auth-server';
import { AppError } from '@/lib/errors';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: ip } = await params; // The ID is the IP
  let action = 'procesar';
  try {
    await validateRouteRole(request, ['admin', 'staff']);
    const body = await request.json();
    action = body.action;
    const status = action === 'approve' ? 'approved' : 'rejected';

    await adminDb.collection('experience_requests').doc(ip).update({
      status,
      updatedAt: new Date().toISOString(),
    });

    logger.info(`Administrador ${action} solicitud de IP: ${ip}`);
    return NextResponse.json({ message: `Solicitud ${status} con éxito.` });
  } catch (e: any) {
    const isAppError = e instanceof AppError;
    const statusCode = isAppError ? e.statusCode : 500;
    const message = isAppError
      ? e.message
      : e.message || 'Error interno del servidor';

    logger.error(`Error al ${action} solicitud de experiencia`, e);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
