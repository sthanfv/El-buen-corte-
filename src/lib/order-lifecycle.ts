import { OrderStatus } from '@/schemas/order';

/**
 * MANDATO-FILTRO: Máquina de Estados Estricta
 * Define qué saltos de estado son válidos para evitar errores humanos e inconsistencias.
 */
export const ORDER_TRANSITIONS: Record<string, OrderStatus[]> = {
  CREATED: ['WAITING_PAYMENT', 'CANCELLED', 'CANCELLED_TIMEOUT'],
  WAITING_PAYMENT: ['PAID_VERIFIED', 'CANCELLED', 'CANCELLED_TIMEOUT'],
  PAID_VERIFIED: ['CUTTING', 'REFUNDED'],
  CUTTING: ['PACKING', 'REFUNDED'],
  PACKING: ['ROUTING', 'REFUNDED'],
  ROUTING: ['DELIVERED', 'DELIVERY_FAILED', 'REFUNDED'],
  DELIVERED: ['RETURNED'],
  DELIVERY_FAILED: ['ROUTING', 'RETURNED', 'CANCELLED'],
  RETURNED: ['REFUNDED'],
  // Estados terminales no pueden transicionar a menos que se especifique lo contrario
  CANCELLED: [],
  CANCELLED_TIMEOUT: [],
  REFUNDED: [],
};

/**
 * Determina si una transición entre estados es legal.
 */
export function canTransition(from: string, to: string): boolean {
  const validTransitions = ORDER_TRANSITIONS[from.toUpperCase()] || [];
  return validTransitions.includes(to.toUpperCase() as OrderStatus);
}

/**
 * MANDATO-FILTRO: Acciones Críticas
 * Determina si un cambio de estado requiere doble confirmación del administrador.
 */
export function requiresDoubleConfirmation(to: string): boolean {
  const criticalStatuses = [
    'PAID_VERIFIED',
    'CANCELLED',
    'REFUNDED',
    'RETURNED',
  ];
  return criticalStatuses.includes(to.toUpperCase());
}

/**
 * TTL para acciones pendientes (5 minutos)
 */
export const PENDING_ACTION_TTL_MS = 5 * 60 * 1000;
