import { adminDb } from './firebase';
import { SystemMode } from '@/schemas/system';
import { logger } from './logger';

let cachedMode: SystemMode | null = null;
let lastFetch = 0;
const CACHE_TTL = 30000; // 30 seconds

/**
 * Obtiene el modo actual del sistema con caché simple para optimizar lectura en API.
 * MANDATO-FILTRO: Gobernanza Proactiva
 */
export async function getSystemMode(): Promise<SystemMode> {
  const now = Date.now();
  if (cachedMode && now - lastFetch < CACHE_TTL) {
    return cachedMode;
  }

  try {
    const doc = await adminDb.collection('system_settings').doc('global').get();
    const data = doc.data();
    cachedMode = (data?.mode as SystemMode) || 'NORMAL';
    lastFetch = now;
    return cachedMode;
  } catch (error) {
    logger.error('Error fetching system mode', { error });
    return 'NORMAL'; // Fail-safe to NORMAL
  }
}

/**
 * Genera un ID de correlación para auditoría forense.
 */
export function generateCorrelationId(): string {
  return `TX-${Date.now()}-${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
}

/**
 * Determina si una acción está permitida basado en el modo del sistema.
 */
export function isActionAllowed(mode: SystemMode, action: string): boolean {
  if (mode === 'NORMAL') return true;

  if (mode === 'DEGRADED') {
    // En modo degradado, permitimos casi todo pero con alertas
    return true;
  }

  if (mode === 'EMERGENCY') {
    // BLOQUEOS DUROS en Emergencia
    const forbiddenInEmergency = [
      'ORDER_BULK_DELETE',
      'ADMIN_SETTINGS_CHANGE',
      'USER_ROLE_CHANGE',
      'ORDER_STATUS_OVERRIDE', // Solo flujos estándar permitidos
    ];
    return !forbiddenInEmergency.includes(action);
  }

  return true;
}
