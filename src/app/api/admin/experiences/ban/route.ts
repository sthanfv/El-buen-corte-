import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase';
import { logger } from '@/lib/logger';
import { validateRouteRole } from '@/lib/auth-server';
import { AppError } from '@/lib/errors';

export async function POST(request: NextRequest) {
  try {
    await validateRouteRole(request, ['admin']);
    const { ip, reason } = await request.json();

    if (!ip)
      return NextResponse.json({ error: 'IP requerida' }, { status: 400 });

    await adminDb
      .collection('banned_ips')
      .doc(ip)
      .set({
        ip,
        reason: reason || 'Abuso del sistema / Spam',
        bannedAt: new Date().toISOString(),
      });

    logger.warn(`IP BANEADA: ${ip}. Motivo: ${reason}`);

    return NextResponse.json({ message: 'IP bloqueada con éxito.' });
  } catch (e: any) {
    const isAppError = e instanceof AppError;
    const statusCode = isAppError ? e.statusCode : 500;
    const message = isAppError ? e.message : 'Error al banear IP';

    logger.error('Error al banear IP', e);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

export async function GET(request: NextRequest) {
  try {
    await validateRouteRole(request, ['admin', 'staff']);
    const snapshot = await adminDb.collection('banned_ips').get();
    const bannedIps = snapshot.docs.map((doc) => doc.id);
    return NextResponse.json(bannedIps);
  } catch (e: any) {
    const isAppError = e instanceof AppError;
    const statusCode = isAppError ? e.statusCode : 500;
    const message = isAppError ? e.message : 'Internal Error';

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
