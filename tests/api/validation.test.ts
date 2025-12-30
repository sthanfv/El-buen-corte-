import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { validateAndSanitize } from '@/lib/validation';

describe('Validación y Sanitización', () => {
  it('escapa caracteres XSS en strings simples', () => {
    const schema = z.object({ name: z.string() });
    const result = validateAndSanitize(schema, {
      name: "<script>alert('xss')</script>Hola",
    });

    expect(result.name).toContain('&lt;script&gt;');
    expect(result.name).toContain('&#x27;xss&#x27;');
    expect(result.name).toContain('Hola');
  });

  it('escapa de forma recursiva en objetos anidados', () => {
    const schema = z.object({
      user: z.object({
        bio: z.string(),
      }),
    });
    const result = validateAndSanitize(schema, {
      user: { bio: '<b>Negrita</b> <img src=x onerror=alert(1)>' },
    });

    expect(result.user.bio).toContain('&lt;b&gt;');
    expect(result.user.bio).toContain('&lt;img');
    expect(result.user.bio).toContain('onerror'); // Sanitizer only escapes brackets, doesn't strip attributes
  });

  it('mantiene intactos valores que no son strings', () => {
    const schema = z.object({
      age: z.number(),
      isActive: z.boolean(),
    });
    const data = { age: 25, isActive: true };
    const result = validateAndSanitize(schema, data);

    expect(result).toEqual(data);
  });
});
