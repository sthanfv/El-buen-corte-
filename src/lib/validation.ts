import { z } from 'zod';
import { sanitize } from './sanitize';

/**
 * MANDATO-FILTRO: Validación + Sanitización automática.
 * Procesa un esquema Zod y limpia recursivamente todos los strings encontrados.
 */
export function validateAndSanitize<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): z.infer<T> {
  const parsed = schema.parse(data);

  // Sanitización profunda de objetos
  const processValue = (val: any): any => {
    if (typeof val === 'string') return sanitize(val);
    if (Array.isArray(val)) return val.map(processValue);
    if (val !== null && typeof val === 'object') {
      return Object.fromEntries(
        Object.entries(val).map(([k, v]) => [k, processValue(v)])
      );
    }
    return val;
  };

  return processValue(parsed);
}
