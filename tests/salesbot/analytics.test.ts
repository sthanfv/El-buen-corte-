import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  hashMessage,
  getAnonymousUserId,
  getAggregateMetrics,
  type SalesBotMetrics,
  type SalesBotAnalyticsEvent,
} from '@/lib/salesbot-analytics';
import { SalesBotMessage } from '@/types/salesbot';

describe('SalesBot Analytics', () => {
  beforeEach(() => {
    // Clear localStorage before each test
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('hashMessage', () => {
    it('should generate consistent hash for same message', () => {
      const message = 'Test message content';
      const hash1 = hashMessage(message);
      const hash2 = hashMessage(message);

      expect(hash1).toBe(hash2);
    });

    it('should generate different hashes for different messages', () => {
      const hash1 = hashMessage('Message A');
      const hash2 = hashMessage('Message B');

      expect(hash1).not.toBe(hash2);
    });

    it('should handle empty strings', () => {
      const hash = hashMessage('');
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });
  });

  describe('getAnonymousUserId', () => {
    it('should generate user ID if not exists', () => {
      const userId = getAnonymousUserId();

      expect(userId).toBeDefined();
      expect(userId).toMatch(/^anon_/);
    });

    it('should return same ID on subsequent calls', () => {
      const userId1 = getAnonymousUserId();
      const userId2 = getAnonymousUserId();

      expect(userId1).toBe(userId2);
    });

    it('should persist ID in localStorage', () => {
      const userId = getAnonymousUserId();
      const stored = localStorage.getItem('bc_anonymous_id');

      expect(stored).toBe(userId);
    });
  });

  describe('getAggregateMetrics', () => {
    it('should calculate correct totals', () => {
      const metrics: SalesBotMetrics[] = [
        {
          ruleId: 'rule1',
          messageHash: 'hash1',
          impressions: 100,
          clicks: 20,
          dismissals: 5,
          conversions: 10,
          ctr: 20,
          conversionRate: 10,
          lastUpdated: Date.now(),
        },
        {
          ruleId: 'rule2',
          messageHash: 'hash2',
          impressions: 200,
          clicks: 40,
          dismissals: 10,
          conversions: 20,
          ctr: 20,
          conversionRate: 10,
          lastUpdated: Date.now(),
        },
      ];

      const aggregate = getAggregateMetrics(metrics);

      expect(aggregate.impressions).toBe(300);
      expect(aggregate.clicks).toBe(60);
      expect(aggregate.dismissals).toBe(15);
      expect(aggregate.conversions).toBe(30);
      expect(aggregate.ctr).toBe(20);
      expect(aggregate.conversionRate).toBe(10);
    });

    it('should handle empty metrics array', () => {
      const aggregate = getAggregateMetrics([]);

      expect(aggregate.impressions).toBe(0);
      expect(aggregate.clicks).toBe(0);
      expect(aggregate.avgCtr).toBe(0);
      expect(aggregate.avgConversionRate).toBe(0);
    });

    it('should calculate correct averages', () => {
      const metrics: SalesBotMetrics[] = [
        {
          ruleId: 'rule1',
          messageHash: 'hash1',
          impressions: 100,
          clicks: 10,
          dismissals: 0,
          conversions: 5,
          ctr: 10,
          conversionRate: 5,
          lastUpdated: Date.now(),
        },
        {
          ruleId: 'rule2',
          messageHash: 'hash2',
          impressions: 100,
          clicks: 30,
          dismissals: 0,
          conversions: 15,
          ctr: 30,
          conversionRate: 15,
          lastUpdated: Date.now(),
        },
      ];

      const aggregate = getAggregateMetrics(metrics);

      expect(aggregate.avgCtr).toBe(20); // (10 + 30) / 2
      expect(aggregate.avgConversionRate).toBe(10); // (5 + 15) / 2
    });
  });

  describe('analytics event tracking', () => {
    it('should create valid analytics event', () => {
      const message: SalesBotMessage = {
        message: 'Test message',
        icon: 'sparkles',
        ruleId: 'test_rule',
        priority: 50,
      };

      const event: SalesBotAnalyticsEvent = {
        ruleId: message.ruleId,
        messageHash: hashMessage(message.message),
        eventType: 'impression',
        timestamp: Date.now(),
        userId: getAnonymousUserId(),
      };

      expect(event.ruleId).toBe('test_rule');
      expect(event.eventType).toBe('impression');
      expect(event.messageHash).toBeDefined();
      expect(event.userId).toBeDefined();
    });
  });
});
