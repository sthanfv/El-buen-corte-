/**
 * MANDATO-FILTRO: Definición de roles del sistema.
 */
export type Role = 'user' | 'staff' | 'admin';

export const ROLES: Record<string, Role> = {
  USER: 'user',
  STAFF: 'staff',
  ADMIN: 'admin',
};
