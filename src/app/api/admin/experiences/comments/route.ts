import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase';
import { logger } from '@/lib/logger';
import { validateRouteRole } from '@/lib/auth-server';
import { AppError } from '@/lib/errors';

export async function GET(request: NextRequest) {
  try {
    await validateRouteRole(request, ['admin', 'staff']);
    const snapshot = await adminDb
      .collection('experience_comments')
      .orderBy('createdAt', 'desc')
      .get();
    const comments = snapshot.docs.map((doc) => doc.data());
    return NextResponse.json(comments);
  } catch (e: any) {
    const isAppError = e instanceof AppError;
    const statusCode = isAppError ? e.statusCode : 500;
    const message = isAppError ? e.message : 'Internal Server Error';

    logger.error('Error fetching experience comments', e);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
