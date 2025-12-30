import { AppError } from '@/lib/errors';
import { Role } from './roles';

/**
 * MANDATO-FILTRO: Validador de roles en el backend.
 * Lanza un error 403 si el usuario no tiene los privilegios necesarios.
 */
export function requireRole(userRole: string | undefined, allowed: Role[]) {
  if (!userRole || !allowed.includes(userRole as Role)) {
    throw new AppError('Acceso denegado: Privilegios insuficientes', 403);
  }
}
