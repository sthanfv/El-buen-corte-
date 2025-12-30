import { describe, it, expect, beforeEach } from 'vitest';
import {
  assignVariant,
  calculateSignificance,
  validateExperiment,
  applyExperiment,
  type SalesBotExperiment,
} from '@/lib/salesbot-experiments';
import { SalesBotMessage } from '@/types/salesbot';

describe('SalesBot A/B Testing', () => {
  const mockExperiment: SalesBotExperiment = {
    id: 'exp_test',
    ruleId: 'test_rule',
    name: 'Test Experiment',
    variants: [
      { id: 'variant_a', message: 'Message A', weight: 50 },
      { id: 'variant_b', message: 'Message B', weight: 50 },
    ],
    status: 'active',
    startDate: Date.now(),
    createdBy: 'test_user',
  };

  beforeEach(() => {
    if (typeof window !== 'undefined') {
      localStorage.clear();
    }
  });

  describe('assignVariant', () => {
    it('should assign consistent variant for same user', () => {
      const variant1 = assignVariant(mockExperiment);
      const variant2 = assignVariant(mockExperiment);

      expect(variant1).toBe(variant2);
    });

    it('should return valid variant ID', () => {
      const variant = assignVariant(mockExperiment);
      const validIds = mockExperiment.variants.map((v) => v.id);

      expect(validIds).toContain(variant);
    });

    it('should distribute variants according to weights', () => {
      const unequalExperiment: SalesBotExperiment = {
        ...mockExperiment,
        variants: [
          { id: 'variant_a', message: 'Message A', weight: 80 },
          { id: 'variant_b', message: 'Message B', weight: 20 },
        ],
      };

      // Run multiple times to check distribution
      const results = { variant_a: 0, variant_b: 0 };

      for (let i = 0; i < 100; i++) {
        // Simulate different users
        localStorage.setItem('bc_anonymous_id', `user_${i}`);
        const variant = assignVariant(unequalExperiment);
        results[variant as keyof typeof results]++;
      }

      // Allow some variance, but should roughly respect weights
      expect(results.variant_a).toBeGreaterThan(results.variant_b);
    });

    it('should handle edge case with 0% weight variant', () => {
      const edgeExperiment: SalesBotExperiment = {
        ...mockExperiment,
        variants: [
          { id: 'variant_a', message: 'Message A', weight: 100 },
          { id: 'variant_b', message: 'Message B', weight: 0 },
        ],
      };

      const variant = assignVariant(edgeExperiment);
      expect(variant).toBe('variant_a');
    });
  });

  describe('calculateSignificance', () => {
    it('should detect significant difference', () => {
      const variantA = { conversions: 50, impressions: 1000 }; // 5% conversion
      const variantB = { conversions: 100, impressions: 1000 }; // 10% conversion

      const result = calculateSignificance(variantA, variantB);

      expect(result.isSignificant).toBe(true);
      expect(result.winner).toBe('b');
      expect(result.pValue).toBeLessThan(0.05);
    });

    it('should not detect significance with small sample', () => {
      const variantA = { conversions: 5, impressions: 10 };
      const variantB = { conversions: 7, impressions: 10 };

      const result = calculateSignificance(variantA, variantB);

      // Small sample, likely not significant
      expect(result.pValue).toBeGreaterThan(0.01);
    });

    it('should handle zero impressions gracefully', () => {
      const variantA = { conversions: 0, impressions: 0 };
      const variantB = { conversions: 5, impressions: 100 };

      const result = calculateSignificance(variantA, variantB);

      expect(result.isSignificant).toBe(false);
      expect(result.winner).toBe('none');
      expect(result.pValue).toBe(1);
    });

    it('should handle identical variants', () => {
      const variantA = { conversions: 50, impressions: 1000 };
      const variantB = { conversions: 50, impressions: 1000 };

      const result = calculateSignificance(variantA, variantB);

      expect(result.isSignificant).toBe(false);
      expect(result.winner).toBe('none');
    });
  });

  describe('validateExperiment', () => {
    it('should pass validation for valid experiment', () => {
      const errors = validateExperiment(mockExperiment);
      expect(errors).toHaveLength(0);
    });

    it('should fail if missing ID', () => {
      const invalid = { ...mockExperiment, id: '' };
      const errors = validateExperiment(invalid);

      expect(errors).toContain('ID is required');
    });

    it('should fail if weights do not sum to 100', () => {
      const invalid: SalesBotExperiment = {
        ...mockExperiment,
        variants: [
          { id: 'a', message: 'A', weight: 40 },
          { id: 'b', message: 'B', weight: 40 },
        ],
      };

      const errors = validateExperiment(invalid);
      expect(errors).toContain('Variant weights must total 100');
    });

    it('should fail if less than 2 variants', () => {
      const invalid: SalesBotExperiment = {
        ...mockExperiment,
        variants: [{ id: 'a', message: 'A', weight: 100 }],
      };

      const errors = validateExperiment(invalid);
      expect(errors).toContain('At least 2 variants required');
    });

    it('should fail if variant has invalid weight', () => {
      const invalid: SalesBotExperiment = {
        ...mockExperiment,
        variants: [
          { id: 'a', message: 'A', weight: 150 },
          { id: 'b', message: 'B', weight: -50 },
        ],
      };

      const errors = validateExperiment(invalid);
      expect(errors.length).toBeGreaterThan(0);
    });
  });

  describe('applyExperiment', () => {
    it('should apply experiment to matching message', () => {
      const message: SalesBotMessage = {
        message: 'Original message',
        icon: 'sparkles',
        ruleId: 'test_rule',
        priority: 50,
      };

      const result = applyExperiment(message, mockExperiment);

      expect(result.message.message).not.toBe('Original message');
      expect(['Message A', 'Message B']).toContain(result.message.message);
      expect(result.experimentData).toBeDefined();
      expect(result.experimentData?.experimentId).toBe('exp_test');
    });

    it('should not apply if experiment is ended', () => {
      const endedExperiment: SalesBotExperiment = {
        ...mockExperiment,
        status: 'ended',
      };

      const message: SalesBotMessage = {
        message: 'Original message',
        icon: 'sparkles',
        ruleId: 'test_rule',
        priority: 50,
      };

      const result = applyExperiment(message, endedExperiment);

      expect(result.message.message).toBe('Original message');
      expect(result.experimentData).toBeUndefined();
    });

    it('should not apply if rule IDs do not match', () => {
      const message: SalesBotMessage = {
        message: 'Original message',
        icon: 'sparkles',
        ruleId: 'different_rule',
        priority: 50,
      };

      const result = applyExperiment(message, mockExperiment);

      expect(result.message.message).toBe('Original message');
      expect(result.experimentData).toBeUndefined();
    });
  });
});
