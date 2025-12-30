/**
 * MANDATO-FILTRO: Prevención proactiva de XSS.
 * Escapa caracteres HTML para evitar inyecciones de scripts en la base de datos y UI.
 */
export function sanitize(input: string): string {
  if (typeof input !== 'string') return input;

  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}
