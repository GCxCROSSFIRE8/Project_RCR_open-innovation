import * as admin from 'firebase-admin';
import { mockDb } from './mock-db';

/**
 * Returns the Firebase Admin DB instance, or falls back to Mock DB.
 * Falls back automatically when env vars are missing or invalid.
 */
function getFirebaseAdminApp() {
  if (admin.apps.length > 0) return admin.apps[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  // If any required key is missing or empty, skip initialization
  if (!projectId || !clientEmail || !privateKey || privateKey.trim() === '') {
    return null;
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert({ projectId, clientEmail, privateKey }),
    });
  } catch (error) {
    console.warn('[Firebase Admin] Init failed — using Mock DB:', (error as Error).message);
    return null;
  }
}

export const getAdminDb = (isSimulation?: boolean): any => {
  const app = getFirebaseAdminApp();
  if (!app) {
    console.log('[Firebase Admin] No app — using Mock DB');
    return mockDb;
  }
  return admin.firestore();
};

export const getAdminAuth = () => {
  const app = getFirebaseAdminApp();
  if (!app) throw new Error('Firebase Admin Auth unavailable in simulation mode.');
  return admin.auth();
};

// Safe legacy exports
export const adminDb = null;
export const adminAuth = null;
