import { describe, it, expect } from 'vitest';
import { requireRole } from '@/lib/auth/require-role';
import { AppError } from '@/lib/errors';

describe('Control de roles', () => {
  it('bloquea acceso no autorizado', () => {
    // @ts-ignore - Simulating invalid role pair
    expect(() => requireRole('user', ['admin'])).toThrow(AppError);
    expect(() => requireRole('user', ['admin'])).toThrow('Acceso denegado');
  });

  it('permite acceso autorizado', () => {
    expect(() => requireRole('admin', ['admin'])).not.toThrow();
    expect(() => requireRole('staff', ['staff', 'admin'])).not.toThrow();
  });

  it('bloquea si el rol es undefined', () => {
    expect(() => requireRole(undefined, ['admin'])).toThrow(AppError);
  });
});
