import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase';
import { validateRouteRole } from '@/lib/auth-server';
import { AppError } from '@/lib/errors';
import { z } from 'zod';

// ✅ Schema for cart recovery tracking
const CartRecoverySchema = z.object({
  userId: z.string(),
  cartValue: z.number().min(0),
  itemCount: z.number().int().min(1),
  abandonedAt: z.number(),
  items: z.array(
    z.object({
      name: z.string(),
      price: z.number().min(0),
    })
  ),
});

// ✅ POST: Log abandoned cart (public, rate-limited)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate input
    const validated = CartRecoverySchema.parse(body);

    // Save to Firestore
    await adminDb.collection('salesbot_cart_recovery').add({
      ...validated,
      recoveredAt: null,
      recoveryMessage: null,
      createdAt: Date.now(),
    });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    if (e.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Validation failed', details: e.errors },
        { status: 400 }
      );
    }

    return NextResponse.json({ error: 'Failed to log cart' }, { status: 500 });
  }
}

// ✅ GET: Recovery statistics (Admin only)
export async function GET(req: NextRequest) {
  try {
    await validateRouteRole(req, ['admin', 'staff']);

    const snapshot = await adminDb.collection('salesbot_cart_recovery').get();

    const carts = snapshot.docs.map((doc) => doc.data());

    const stats = {
      totalAbandoned: carts.length,
      totalRecovered: carts.filter((c) => c.recoveredAt).length,
      recoveryRate:
        carts.length > 0
          ? (
              (carts.filter((c) => c.recoveredAt).length / carts.length) *
              100
            ).toFixed(2)
          : 0,
      totalValue: carts.reduce((sum, c) => sum + (c.cartValue || 0), 0),
      recoveredValue: carts
        .filter((c) => c.recoveredAt)
        .reduce((sum, c) => sum + (c.cartValue || 0), 0),
    };

    return NextResponse.json({
      success: true,
      stats,
      carts: carts.slice(0, 50),
    });
  } catch (e: any) {
    const isAppError = e instanceof AppError;
    const statusCode = isAppError ? e.statusCode : 500;
    const message = isAppError
      ? e.message
      : 'Failed to fetch cart recovery stats';

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

// ✅ PATCH: Mark cart as recovered
export async function PATCH(req: NextRequest) {
  try {
    await validateRouteRole(req, ['admin']);

    const body = await req.json();
    const { cartId, recoveryMessage } = body;

    if (!cartId) {
      return NextResponse.json({ error: 'Cart ID required' }, { status: 400 });
    }

    await adminDb
      .collection('salesbot_cart_recovery')
      .doc(cartId)
      .update({
        recoveredAt: Date.now(),
        recoveryMessage: recoveryMessage || 'Manual recovery',
      });

    return NextResponse.json({ success: true });
  } catch (e: any) {
    const isAppError = e instanceof AppError;
    const statusCode = isAppError ? e.statusCode : 500;
    const message = isAppError ? e.message : 'Failed to update cart';

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
