import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

/**
 * MANDATO-FILTRO: Distributed Rate Limiting
 * Uses Upstash Redis to ensure consistency across serverless instances.
 */

if (
  !process.env.UPSTASH_REDIS_REST_URL ||
  !process.env.UPSTASH_REDIS_REST_TOKEN
) {
  console.warn(
    'MANDATO-FILTRO: Upstash Redis credentials missing. Rate limiting will be disabled or fallback to memory.'
  );
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Create a new ratelimiter, that allows 5 requests per 1 hour
export const orderRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(5, '1 h'),
  analytics: true,
  prefix: '@upstash/ratelimit/orders',
});
