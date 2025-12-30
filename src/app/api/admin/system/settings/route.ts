import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase';
import { validateRouteRole } from '@/lib/auth-server';
import { logAdminAction } from '@/lib/audit-logger';
import { AppError } from '@/lib/errors';
import { headers } from 'next/headers';
import { generateCorrelationId } from '@/lib/system-governance';

export async function GET(req: NextRequest) {
  try {
    await validateRouteRole(req, ['admin']);
    const doc = await adminDb.collection('system_settings').doc('global').get();
    return NextResponse.json(doc.data() || { mode: 'NORMAL' });
  } catch (e: any) {
    const isAppError = e instanceof AppError;
    const statusCode = isAppError ? e.statusCode : 500;
    const message = isAppError ? e.message : 'Failed to fetch settings';
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function POST(req: NextRequest) {
  try {
    const decodedToken = await validateRouteRole(req, ['admin']);
    const body = await req.json();
    const { mode, emergencyMessage, reason } = body;

    // MANDATO-FILTRO: Validación estricta de cambio de configuración
    if (!mode || !reason) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios (mode, reason)' },
        { status: 400 }
      );
    }

    // Solo ADMIN puede cambiar a EMERGENCY (validateRouteRole ya lo filtró, pero mantenemos por seguridad)
    if (mode === 'EMERGENCY' && decodedToken.role !== 'admin') {
      throw new AppError(
        'Privilegios insuficientes para activar MODO EMERGENCIA',
        403
      );
    }

    const settingsUpdate = {
      mode,
      emergencyMessage: emergencyMessage || '',
      updatedAt: Date.now(),
      updatedBy: decodedToken.uid,
    };

    const correlationId = generateCorrelationId();
    const headersList = await headers();

    await adminDb
      .collection('system_settings')
      .doc('global')
      .set(settingsUpdate);

    await logAdminAction({
      actorId: decodedToken.uid,
      action: 'CONFIG_CHANGE',
      targetId: 'system_global_settings',
      before: { mode: 'check_previous' }, // In a real app, fetch first
      after: settingsUpdate,
      reason,
      correlationId,
      ip: headersList.get('x-forwarded-for') || 'unknown',
      userAgent: headersList.get('user-agent') || 'unknown',
      metadata: { action: 'SYSTEM_MODE_CHANGE' },
    });

    return NextResponse.json({ success: true, correlationId });
  } catch (e: any) {
    const isAppError = e instanceof AppError;
    const statusCode = isAppError ? e.statusCode : 500;
    const message = isAppError
      ? e.message
      : e.message || 'Internal Server Error';
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
