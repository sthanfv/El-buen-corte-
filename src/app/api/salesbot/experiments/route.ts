import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase';
import { validateRouteRole } from '@/lib/auth-server';
import { AppError } from '@/lib/errors';
import {
  SalesBotExperiment,
  validateExperiment,
} from '@/lib/salesbot-experiments';

// ✅ GET: List experiments
export async function GET(req: NextRequest) {
  try {
    await validateRouteRole(req, ['admin', 'staff']);

    const snapshot = await adminDb.collection('salesbot_experiments').get();
    const experiments = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json({ success: true, experiments });
  } catch (e: any) {
    const isAppError = e instanceof AppError;
    const statusCode = isAppError ? e.statusCode : 500;
    const message = isAppError ? e.message : 'Failed to fetch experiments';

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

// ✅ POST: Create experiment
export async function POST(req: NextRequest) {
  try {
    const decodedToken = await validateRouteRole(req, ['admin']);
    const body = await req.json();

    // Validate experiment structure
    const errors = validateExperiment(body);
    if (errors.length > 0) {
      return NextResponse.json(
        { error: 'Validation failed', details: errors },
        { status: 400 }
      );
    }

    const experiment: SalesBotExperiment = {
      ...body,
      status: 'active',
      startDate: Date.now(),
      createdBy: decodedToken.uid,
    };

    await adminDb
      .collection('salesbot_experiments')
      .doc(experiment.id)
      .set(experiment);

    return NextResponse.json({ success: true, experiment });
  } catch (e: any) {
    const isAppError = e instanceof AppError;
    const statusCode = isAppError ? e.statusCode : 500;
    const message = isAppError ? e.message : 'Failed to create experiment';

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}

// ✅ PATCH: Update/end experiment
export async function PATCH(req: NextRequest) {
  try {
    await validateRouteRole(req, ['admin']);
    const body = await req.json();
    const { id, status } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Experiment ID required' },
        { status: 400 }
      );
    }

    const updates: any = {};
    if (status === 'ended') {
      updates.status = 'ended';
      updates.endDate = Date.now();
    }

    await adminDb.collection('salesbot_experiments').doc(id).update(updates);

    return NextResponse.json({ success: true });
  } catch (e: any) {
    const isAppError = e instanceof AppError;
    const statusCode = isAppError ? e.statusCode : 500;
    const message = isAppError ? e.message : 'Failed to update experiment';

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
