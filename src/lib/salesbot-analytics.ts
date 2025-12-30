import { db } from '@/firebase/client';
import { adminDb } from '@/lib/firebase';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { SalesBotMessage } from '@/types/salesbot';

// ✅ MANDATO-FILTRO: Analytics event types
export type SalesBotEventType =
  | 'impression'
  | 'click'
  | 'dismiss'
  | 'conversion';

export interface SalesBotAnalyticsEvent {
  ruleId: string;
  messageHash: string;
  eventType: SalesBotEventType;
  timestamp: number;
  experimentId?: string;
  variantId?: string;
  userId?: string; // Anonymous ID from localStorage
}

export interface SalesBotMetrics {
  ruleId: string;
  messageHash: string;
  impressions: number;
  clicks: number;
  dismissals: number;
  conversions: number;
  ctr: number; // Click-through rate
  conversionRate: number;
  lastUpdated: number;
}

// ✅ SECURITY: Generate anonymous user ID (no PII)
export function getAnonymousUserId(): string {
  if (typeof window === 'undefined') return 'server';

  let userId = localStorage.getItem('bc_anonymous_id');
  if (!userId) {
    userId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('bc_anonymous_id', userId);
  }
  return userId;
}

// ✅ Hash message for tracking (consistent ID)
export function hashMessage(message: string): string {
  let hash = 0;
  for (let i = 0; i < message.length; i++) {
    const char = message.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

// ✅ Track analytics event (batched writes)
let pendingEvents: SalesBotAnalyticsEvent[] = [];
let batchTimeout: NodeJS.Timeout | null = null;

export async function trackSalesBotEvent(
  message: SalesBotMessage,
  eventType: SalesBotEventType,
  experimentData?: { experimentId: string; variantId: string }
): Promise<void> {
  try {
    const event: SalesBotAnalyticsEvent = {
      ruleId: message.ruleId,
      messageHash: hashMessage(message.message),
      eventType,
      timestamp: Date.now(),
      userId: getAnonymousUserId(),
      ...experimentData,
    };

    pendingEvents.push(event);

    // ✅ PERFORMANCE: Batch writes every 5 seconds
    if (!batchTimeout) {
      batchTimeout = setTimeout(async () => {
        await flushAnalytics();
        batchTimeout = null;
      }, 5000);
    }
  } catch (error) {
    // ✅ SECURITY: Fail silently, don't break UX
    console.warn('Analytics tracking failed:', error);
  }
}

// ✅ Flush pending analytics to Firestore
async function flushAnalytics(): Promise<void> {
  if (pendingEvents.length === 0) return;

  const eventsToFlush = [...pendingEvents];
  pendingEvents = [];

  try {
    // Group by ruleId + messageHash
    const grouped = eventsToFlush.reduce(
      (acc, event) => {
        const key = `${event.ruleId}_${event.messageHash}`;
        if (!acc[key]) {
          acc[key] = {
            ruleId: event.ruleId,
            messageHash: event.messageHash,
            impressions: 0,
            clicks: 0,
            dismissals: 0,
            conversions: 0,
          };
        }

        if (event.eventType === 'impression') acc[key].impressions++;
        if (event.eventType === 'click') acc[key].clicks++;
        if (event.eventType === 'dismiss') acc[key].dismissals++;
        if (event.eventType === 'conversion') acc[key].conversions++;

        return acc;
      },
      {} as Record<string, any>
    );

    // Write to Firestore
    for (const key of Object.keys(grouped)) {
      const data = grouped[key];
      const docRef = doc(db, 'salesbot_analytics', key);

      await setDoc(
        docRef,
        {
          ruleId: data.ruleId,
          messageHash: data.messageHash,
          impressions: increment(data.impressions),
          clicks: increment(data.clicks),
          dismissals: increment(data.dismissals),
          conversions: increment(data.conversions),
          lastUpdated: Date.now(),
        },
        { merge: true }
      );
    }
  } catch (error) {
    console.error('Failed to flush analytics:', error);
    // Re-add events to queue if failed
    pendingEvents.push(...eventsToFlush);
  }
}

// ✅ Get analytics metrics (server-side)
export async function getSalesBotMetrics(
  ruleId?: string
): Promise<SalesBotMetrics[]> {
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

// ✅ Calculate aggregate metrics
export function getAggregateMetrics(metrics: SalesBotMetrics[]) {
  const total = metrics.reduce(
    (acc, m) => ({
      impressions: acc.impressions + m.impressions,
      clicks: acc.clicks + m.clicks,
      dismissals: acc.dismissals + m.dismissals,
      conversions: acc.conversions + m.conversions,
    }),
    { impressions: 0, clicks: 0, dismissals: 0, conversions: 0 }
  );

  return {
    ...total,
    ctr: total.impressions > 0 ? (total.clicks / total.impressions) * 100 : 0,
    conversionRate:
      total.impressions > 0 ? (total.conversions / total.impressions) * 100 : 0,
    avgCtr:
      metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.ctr, 0) / metrics.length
        : 0,
    avgConversionRate:
      metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.conversionRate, 0) / metrics.length
        : 0,
  };
}
