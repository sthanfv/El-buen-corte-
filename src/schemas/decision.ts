import { z } from 'zod';

export const ManualDecisionTypeEnum = z.enum([
  'CORTESIA',
  'AJUSTE_PESO',
  'OVERRIDE_ESTADO',
  'CANCELACION_MANUAL',
]);

export const ManualDecisionSchema = z.object({
  orderId: z.string().min(1),
  type: ManualDecisionTypeEnum,
  reason: z
    .string()
    .min(5, 'El motivo debe tener al menos 5 caracteres')
    .max(500),
  operatorId: z.string(),
  financialImpact: z.number().default(0),
  stockImpact: z.boolean().default(false),
  at: z.number(),
});

export type ManualDecision = z.infer<typeof ManualDecisionSchema>;
