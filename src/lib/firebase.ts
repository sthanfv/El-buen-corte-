import * as admin from 'firebase-admin';
import { env } from './env';

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
  try {
    const serviceAccountJson = env.FIREBASE_ADMIN_SERVICE_ACCOUNT_JSON;
    const privateKey = env.FIREBASE_ADMIN_PRIVATE_KEY;
    const clientEmail = env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const projectId = env.FIREBASE_ADMIN_PROJECT_ID;

    let cert;

    if (privateKey && clientEmail && projectId) {
      // Option A: Individual Vars (Proven to work)
      cert = {
        projectId,
        clientEmail,
        // Handle escaped newlines from .env (e.g. `\\n` to `\n`)
        privateKey: privateKey.replace(/\\n/g, '\n'),
      };
    } else if (serviceAccountJson) {
      // Option B: JSON Blob (Fallback)
      cert = JSON.parse(serviceAccountJson);
    } else {
      throw new Error('Missing Firebase Admin Credentials.');
    }

    admin.initializeApp({
      credential: admin.credential.cert(cert),
    });
  } catch (e) {
    // In production, avoid exposing error details
  }
}

export const adminAuth = admin.auth();
export const adminDb = admin.firestore();
export const FieldValue = admin.firestore.FieldValue;
