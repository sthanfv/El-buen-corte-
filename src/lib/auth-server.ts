import { NextRequest } from 'next/server';
import { adminAuth } from '@/lib/firebase';
import { logger } from '@/lib/logger';
import { Role } from './auth/roles';
import { requireRole } from './auth/require-role';

/**
 * MANDATO-FILTRO: Sistema de Verificación de Autenticación RBAC
 *
 * Centraliza la validación de privilegios mediante tokens de Firebase.
 * Soporta los nuevos roles: admin, staff, user.
 */

export async function getAuthenticatedUser(request: NextRequest) {
  const authHeader = request.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await adminAuth.verifyIdToken(idToken);
    return decodedToken;
  } catch (error) {
    logger.error('Error verificando token en backend', error);
    return null;
  }
}

/**
 * Valida que el usuario tenga uno de los roles autorizados.
 * Lanza AppError 403 si falla.
 */
export async function validateRouteRole(request: NextRequest, allowed: Role[]) {
  const user = await getAuthenticatedUser(request);
  if (!user) {
    throw new Error('No autenticado');
  }

  // Migración: Soportamos claim 'admin' antiguo y 'role' nuevo para evitar bloqueos inmediatos
  const role = (user.role as string) || (user.admin ? 'admin' : 'user');

  requireRole(role, allowed);
  return user;
}

/**
 * @deprecated Usar validateRouteRole para mayor granularidad.
 * Mantiene compatibilidad con rutas existentes.
 */
export async function verifyAdmin(request: NextRequest): Promise<boolean> {
  try {
    await validateRouteRole(request, ['admin']);
    return true;
  } catch (error) {
    return false;
  }
}
