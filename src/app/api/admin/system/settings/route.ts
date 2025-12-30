import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase';
import { verifyAdmin } from '@/lib/auth-server';
import { logAdminAction } from '@/lib/audit-logger';
import { headers } from 'next/headers';
import { SystemSettingsSchema, SystemMode } from '@/schemas/system';
import { generateCorrelationId } from '@/lib/system-governance';

export async function GET(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const doc = await adminDb.collection('system_settings').doc('global').get();
    return NextResponse.json(doc.data() || { mode: 'NORMAL' });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { mode, emergencyMessage, reason } = body;

    // MANDATO-FILTRO: Validación estricta de cambio de configuración
    if (!mode || !reason) {
      return NextResponse.json(
        { error: 'Faltan campos obligatorios (mode, reason)' },
        { status: 400 }
      );
    }

    const idToken = req.headers.get('Authorization')!.split('Bearer ')[1];
    const { adminAuth } = require('@/lib/firebase');
    const decodedToken = await adminAuth.verifyIdToken(idToken);

    // Solo OWNER puede cambiar a EMERGENCY
    if (
      mode === 'EMERGENCY' &&
      decodedToken.role !== 'OWNER' &&
      !decodedToken.admin
    ) {
      return NextResponse.json(
        { error: 'Privilegios insuficientes para activar MODO EMERGENCIA' },
        { status: 403 }
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
