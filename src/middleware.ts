import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { env } from './lib/env';
import { rateLimit as localRateLimit } from './lib/rate-limit';

// 🛡️ PRODUCTION-GRADE SECURITY: Distributed Rate Limiting with Upstash Redis
// The keys are provided in the .env file.

const redis = new Redis({
  url: env.UPSTASH_REDIS_REST_URL,
  token: env.UPSTASH_REDIS_REST_TOKEN,
});

const ratelimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(100, '60 s'),
  analytics: true,
});

export async function middleware(request: NextRequest) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0] ||
    request.headers.get('x-real-ip') ||
    '127.0.0.1';

  // 🛡️ FASE 2: Rate Limit local (Primer cortafuegos ultra-rápido)
  if (!localRateLimit(ip)) {
    return NextResponse.json(
      { error: 'Demasiadas solicitudes' },
      { status: 429 }
    );
  }

  // ✅ BLACKLIST CHECK (DEFENSA PROACTIVA - MANDATO-FILTRO)
  try {
    const isBlacklisted = await redis.get(`blacklist_${ip}`);
    if (isBlacklisted) {
      return NextResponse.redirect(
        'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      );
    }

    // Rate Limiting Check
    const { success, limit, remaining, reset } = await ratelimit.limit(
      `ratelimit_${ip}`
    );

    if (!success) {
      return new NextResponse('Too Many Requests', {
        status: 429,
        headers: {
          'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
        },
      });
    }
  } catch (error) {
    console.error('Middleware Redis Error (Fail Open):', error);
    // En caso de error de Redis (ej. config faltante en Prod), permitimos el paso
    // para no tumbar la aplicación. Seguridad vs Disponibilidad -> Disponibilidad gana aquí.
  }

  const response = NextResponse.next();

  // 🛡️ CONSOLIDATED SECURITY HEADERS (OWASP RECOMMENDATIONS)
  const headers = response.headers;

  // HSTS: Forzar HTTPS siempre (2 años - owasp recommendation)
  headers.set(
    'Strict-Transport-Security',
    'max-age=63072000; includeSubDomains; preload'
  );

  // Anti-Clickjacking: DENY por defecto
  headers.set('X-Frame-Options', 'DENY');

  // Anti-MIME Sniffing
  headers.set('X-Content-Type-Options', 'nosniff');

  // Referrer Policy: Privacidad máxima
  headers.set('Referrer-Policy', 'no-referrer');

  // Permissions Policy
  headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );

  // CSP: Content Security Policy (Endurecida FASE 2)
  headers.set(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' https: data: blob:; script-src 'self' 'unsafe-inline' https://apis.google.com; style-src 'self' 'unsafe-inline'; font-src 'self' data:; connect-src 'self' https://firestore.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.firebaseio.com https://*.vercel-storage.com;"
  );

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
