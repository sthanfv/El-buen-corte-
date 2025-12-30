import { NextRequest, NextResponse } from 'next/server';
import {
  getAggregateMetrics,
  type SalesBotMetrics,
} from '@/lib/salesbot-analytics';
import { adminDb } from '@/lib/firebase';
import { validateRouteRole } from '@/lib/auth-server';
import { AppError } from '@/lib/errors';

// ✅ Get analytics metrics (server-side)
async function getSalesBotMetrics(ruleId?: string): Promise<SalesBotMetrics[]> {
  try {
    const snapshot = await adminDb.collection('salesbot_analytics').get();

    let metrics: SalesBotMetrics[] = snapshot.docs.map((doc) => {
      const data = doc.data();
      const impressions = data.impressions || 0;
      const clicks = data.clicks || 0;
      const conversions = data.conversions || 0;

      return {
        ruleId: data.ruleId,
        messageHash: data.messageHash,
        impressions,
        clicks,
        dismissals: data.dismissals || 0,
        conversions,
        ctr: impressions > 0 ? (clicks / impressions) * 100 : 0,
        conversionRate: impressions > 0 ? (conversions / impressions) * 100 : 0,
        lastUpdated: data.lastUpdated || 0,
      };
    });

    // Filter by ruleId if provided
    if (ruleId) {
      metrics = metrics.filter((m) => m.ruleId === ruleId);
    }

    return metrics.sort((a, b) => b.impressions - a.impressions);
  } catch (error) {
    console.error('Failed to get metrics:', error);
    return [];
  }
}

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
