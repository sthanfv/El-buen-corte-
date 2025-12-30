import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase';
import { validateRouteRole } from '@/lib/auth-server';
import { AppError } from '@/lib/errors';

export async function GET(req: NextRequest) {
  try {
    await validateRouteRole(req, ['admin', 'staff']);

    const snapshot = await adminDb
      .collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    const orders = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));

    return NextResponse.json(orders);
  } catch (e: any) {
    const isAppError = e instanceof AppError;
    const statusCode = isAppError ? e.statusCode : 500;
    const message = isAppError ? e.message : 'Internal Server Error';

    console.error('Error listing orders:', e);
    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
