import { NextRequest, NextResponse } from 'next/server';
import {
  getSalesBotMetrics,
  getAggregateMetrics,
} from '@/lib/salesbot-analytics';
import { validateRouteRole } from '@/lib/auth-server';
import { AppError } from '@/lib/errors';

// ✅ GET: Analytics metrics (Admin/Staff only)
export async function GET(req: NextRequest) {
  try {
    // ✅ RBAC: Only admin and staff can view analytics
    await validateRouteRole(req, ['admin', 'staff']);

    const { searchParams } = new URL(req.url);
    const ruleId = searchParams.get('ruleId') || undefined;

    const metrics = await getSalesBotMetrics(ruleId);
    const aggregate = getAggregateMetrics(metrics);

    return NextResponse.json({
      success: true,
      metrics,
      aggregate,
    });
  } catch (e: any) {
    const isAppError = e instanceof AppError;
    const statusCode = isAppError ? e.statusCode : 500;
    const message = isAppError ? e.message : 'Failed to fetch analytics';

    return NextResponse.json({ error: message }, { status: statusCode });
  }
}
