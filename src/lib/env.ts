import { z } from 'zod';

const isTest = process.env.NODE_ENV === 'test';

const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),

  // Firebase Public
  NEXT_PUBLIC_FIREBASE_API_KEY: isTest
    ? z.string().default('mock')
    : z.string(),
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: isTest
    ? z.string().default('mock')
    : z.string(),
  NEXT_PUBLIC_FIREBASE_PROJECT_ID: isTest
    ? z.string().default('mock')
    : z.string(),
  NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET: isTest
    ? z.string().default('mock')
    : z.string(),
  NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: isTest
    ? z.string().default('mock')
    : z.string(),
  NEXT_PUBLIC_FIREBASE_APP_ID: isTest ? z.string().default('mock') : z.string(),

  // Firebase Admin
  FIREBASE_ADMIN_PROJECT_ID: isTest ? z.string().default('mock') : z.string(),
  FIREBASE_ADMIN_CLIENT_EMAIL: isTest
    ? z.string().email().default('mock@example.com')
    : z.string().email(),
  FIREBASE_ADMIN_PRIVATE_KEY: isTest ? z.string().default('mock') : z.string(),
  FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON: z.string().optional(),

  // Upstash Redis
  UPSTASH_REDIS_REST_URL: isTest
    ? z.string().url().default('https://mock.io')
    : z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: isTest ? z.string().default('mock') : z.string(),

  // Resend
  RESEND_API_KEY: z.string().optional(),

  // Sentry
  SENTRY_DSN: z.string().optional(),

  // Apps
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
  NEXT_PUBLIC_ADMIN_EMAILS: z.string().optional(),
});

/**
 * MANDATO-FILTRO: Validación estricta de variables de entorno.
 * Si falta una variable crítica, el sistema fallará inmediatamente al arrancar.
 */
function validateEnv() {
  try {
    return envSchema.parse(process.env);
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingVars = error.errors.map((e) => e.path.join('.')).join(', ');
      console.error(
        '❌ FATAL: Error de configuración de entorno. Faltan o son inválidas:',
        missingVars
      );
      // En producción, esto detendrá el despliegue de forma segura.
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          `Error de configuración de entorno. Faltan: ${missingVars}`
        );
      }
    }
    throw error;
  }
}

export const env = validateEnv();
