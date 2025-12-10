'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import firebaseConfig from './config';

let firebaseApp: FirebaseApp;
let auth: Auth;
let db: Firestore;

if (getApps().length === 0) {
  firebaseApp = initializeApp(firebaseConfig);
} else {
  firebaseApp = getApp();
}

auth = getAuth(firebaseApp);
db = getFirestore(firebaseApp);

export { firebaseApp, auth, db };
