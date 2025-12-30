import { z } from 'zod';

export const SystemModeEnum = z.enum(['NORMAL', 'DEGRADED', 'EMERGENCY']);
export type SystemMode = z.infer<typeof SystemModeEnum>;

export const SystemSettingsSchema = z.object({
  mode: SystemModeEnum.default('NORMAL'),
  updatedAt: z.number(),
  updatedBy: z.string(),
  emergencyMessage: z.string().optional(),
});

export type SystemSettings = z.infer<typeof SystemSettingsSchema>;
