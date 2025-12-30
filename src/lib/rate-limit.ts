/**
 * MANDATO-FILTRO: Rate Limit ligero para el Edge.
 * Nota: En ambientes serverless (Vercel), este Map es por instancia.
 * Se recomienda usar Upstash Redis para límites globales estrictos.
 */
const requests = new Map<string, { count: number; last: number }>();

export function rateLimit(ip: string, limit = 100, windowMs = 60_000) {
  const now = Date.now();
  const entry = requests.get(ip);

  if (!entry || now - entry.last > windowMs) {
    requests.set(ip, { count: 1, last: now });
    return true;
  }

  if (entry.count >= limit) return false;

  entry.count++;
  return true;
}
