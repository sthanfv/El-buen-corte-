import * as admin from 'firebase-admin';
import { adminAuth } from '../lib/firebase';
import { Role } from '../lib/auth/roles';

/**
 * MANDATO-FILTRO: Script de asignación de roles.
 * NO EXPOSE TO CLIENT.
 */
export async function setUserRole(uid: string, role: Role) {
  try {
    await adminAuth.setCustomUserClaims(uid, { role });
    console.log(`✅ Rol [${role}] asignado correctamente al usuario: ${uid}`);
  } catch (error) {
    console.error(`❌ Error al asignar rol:`, error);
    throw error;
  }
}
