import { SalesBotMessage } from '@/types/salesbot';
import { getAnonymousUserId } from './salesbot-analytics';

// ✅ Experiment definition
export interface SalesBotExperiment {
  id: string;
  ruleId: string;
  name: string;
  variants: {
    id: string;
    message: string;
    weight: number; // 0-100, total must be 100
  }[];
  status: 'active' | 'ended';
  startDate: number;
  endDate?: number;
  createdBy: string;
}

// ✅ Variant assignment (consistent per user)
export function assignVariant(experiment: SalesBotExperiment): string {
  const userId = getAnonymousUserId();

  // ✅ CONSISTENCY: Same user always gets same variant
  const hash = simpleHash(`${experiment.id}_${userId}`);
  const bucket = hash % 100; // 0-99

  let cumulative = 0;
  for (const variant of experiment.variants) {
    cumulative += variant.weight;
    if (bucket < cumulative) {
      return variant.id;
    }
  }

  // Fallback to first variant
  return experiment.variants[0].id;
}

// ✅ Simple hash function for consistent assignment
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

// ✅ Apply experiment to message (if active)
export function applyExperiment(
  message: SalesBotMessage,
  experiment: SalesBotExperiment | null
): {
  message: SalesBotMessage;
  experimentData?: { experimentId: string; variantId: string };
} {
  if (
    !experiment ||
    experiment.status !== 'active' ||
    experiment.ruleId !== message.ruleId
  ) {
    return { message };
  }

  const variantId = assignVariant(experiment);
  const variant = experiment.variants.find((v) => v.id === variantId);

  if (!variant) {
    return { message };
  }

  // Override message with variant
  return {
    message: {
      ...message,
      message: variant.message,
    },
    experimentData: {
      experimentId: experiment.id,
      variantId,
    },
  };
}

// ✅ Calculate statistical significance (Z-test for proportions)
export function calculateSignificance(
  variant1: { conversions: number; impressions: number },
  variant2: { conversions: number; impressions: number }
): { pValue: number; isSignificant: boolean; winner: 'a' | 'b' | 'none' } {
  const p1 =
    variant1.impressions > 0 ? variant1.conversions / variant1.impressions : 0;
  const p2 =
    variant2.impressions > 0 ? variant2.conversions / variant2.impressions : 0;

  const n1 = variant1.impressions;
  const n2 = variant2.impressions;

  if (n1 === 0 || n2 === 0) {
    return { pValue: 1, isSignificant: false, winner: 'none' };
  }

  // Pooled proportion
  const p = (variant1.conversions + variant2.conversions) / (n1 + n2);

  // Standard error
  const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));

  if (se === 0) {
    return { pValue: 1, isSignificant: false, winner: 'none' };
  }

  // Z-score
  const z = Math.abs((p1 - p2) / se);

  // Approximate p-value (two-tailed)
  const pValue = 2 * (1 - normalCDF(Math.abs(z)));

  const isSignificant = pValue < 0.05; // 95% confidence
  const winner = isSignificant ? (p1 > p2 ? 'a' : 'b') : 'none';

  return { pValue, isSignificant, winner };
}

// ✅ Normal CDF approximation (for p-value calculation)
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp((-x * x) / 2);
  const prob =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));

  return x > 0 ? 1 - prob : prob;
}

// ✅ Validate experiment structure
export function validateExperiment(
  experiment: Partial<SalesBotExperiment>
): string[] {
  const errors: string[] = [];

  if (!experiment.id) errors.push('ID is required');
  if (!experiment.ruleId) errors.push('Rule ID is required');
  if (!experiment.name) errors.push('Name is required');
  if (!experiment.variants || experiment.variants.length < 2) {
    errors.push('At least 2 variants required');
  }

  if (experiment.variants) {
    const totalWeight = experiment.variants.reduce(
      (sum, v) => sum + (v.weight || 0),
      0
    );
    if (Math.abs(totalWeight - 100) > 0.01) {
      errors.push('Variant weights must total 100');
    }

    experiment.variants.forEach((v, i) => {
      if (!v.id) errors.push(`Variant ${i + 1} missing ID`);
      if (!v.message) errors.push(`Variant ${i + 1} missing message`);
      if (v.weight < 0 || v.weight > 100)
        errors.push(`Variant ${i + 1} weight out of range`);
    });
  }

  return errors;
}
