import * as Sentry from '@sentry/nextjs';
import { adminDb } from './firebase';

/**
 * Professional Logger Utility with Sentry and Firestore Integration
 * Protocolo: MANDATO-FILTRO.
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug' | 'audit' | 'critical';

class Logger {
  private isProduction = process.env.NODE_ENV === 'production';

  constructor() {
    if (this.isProduction && process.env.SENTRY_DSN) {
      Sentry.init({
        dsn: process.env.SENTRY_DSN,
        tracesSampleRate: 1.0,
      });
    }
  }

  private formatMessage(level: LogLevel, message: string, data?: any) {
    if (this.isProduction) {
      // Producción: Logs estructurados para agregadores (Datadog, GCP, etc.)
      return JSON.stringify({
        timestamp: new Date().toISOString(),
        level: level.toUpperCase(),
        message,
        meta: data
          ? data instanceof Error
            ? { error: data.message, stack: data.stack }
            : data
          : null,
      });
    }
    const timestamp = new Date().toISOString();
    return `[${timestamp}] [${level.toUpperCase()}]: ${message} ${data ? (data instanceof Error ? data.message : JSON.stringify(data)) : ''}`;
  }

  private async persistLog(level: LogLevel, message: string, data?: any) {
    try {
      // ✅ MANDATO-FILTRO: Evitar colapso si falla Firestore persistence
      if (level === 'error' || level === 'audit' || level === 'warn') {
        await adminDb
          .collection('system_logs')
          .add({
            level,
            message,
            data: data
              ? data instanceof Error
                ? { message: data.message, stack: data.stack }
                : JSON.parse(JSON.stringify(data))
              : null,
            timestamp: new Date().toISOString(),
          })
          .catch((err: Error) => console.error('Silent persist fail:', err));
      }
    } catch (e) {
      // No hacemos throw para no romper el flujo principal por un log
    }
  }

  info(message: string, data?: any) {
    if (!this.isProduction) {
      console.info(this.formatMessage('info', message, data));
    } else {
      // En producción solo logueamos info si es estructurado y relevante
      // (Ajustar según necesidad de ruido)
      console.info(this.formatMessage('info', message, data));
    }
  }

  warn(message: string, data?: any) {
    console.warn(this.formatMessage('warn', message, data));
    this.persistLog('warn', message, data);
    if (this.isProduction) {
      Sentry.captureMessage(message, { level: 'warning', extra: data });
    }
  }

  error(message: string, data?: any) {
    console.error(this.formatMessage('error', message, data));
    this.persistLog('error', message, data);
    if (this.isProduction) {
      if (data instanceof Error) {
        Sentry.captureException(data);
      } else {
        Sentry.captureException(new Error(message), { extra: data });
      }
    }
  }

  critical(message: string, data?: any) {
    // ✅ MANDATO-FILTRO: Alerta crítica para monitoreo avanzado
    console.error(
      this.formatMessage('critical', `🚨 [CRITICAL ALERT]: ${message}`, data)
    );
    this.persistLog('critical', message, data);
    if (this.isProduction) {
      Sentry.captureMessage(`CRITICAL: ${message}`, {
        level: 'fatal',
        extra: { ...data, alert: true, immediate_action_required: true },
      });
    }
  }

  audit(message: string, data?: any) {
    // Auditoría es crítica: Siempre se loguea y persiste
    console.log(this.formatMessage('audit', message, data));
    this.persistLog('audit', message, data);
  }

  debug(message: string, data?: any) {
    if (!this.isProduction) {
      console.debug(this.formatMessage('debug', message, data));
    }
  }
}

export const logger = new Logger();
