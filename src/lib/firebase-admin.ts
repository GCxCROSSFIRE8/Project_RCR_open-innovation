import * as admin from 'firebase-admin';

/**
 * Initialize Firebase Admin SDK lazily to prevent module-level crashes 
 * during development if environment variables are temporarily missing.
 */
function getFirebaseAdminApp() {
  if (admin.apps.length > 0) {
    return admin.apps[0];
  }

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    console.error('Firebase Admin Error: Missing required environment variables (FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, or FIREBASE_PRIVATE_KEY).');
    return null;
  }

  try {
    return admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    return null;
  }
}

import { mockDb } from './mock-db';

// ... (existing code)

// Export getters instead of raw constants to handle null/undefined gracefully in routes
export const getAdminDb = (isSimulation?: boolean) => {
  const app = getFirebaseAdminApp();
  
  if (!app) {
    if (isSimulation || process.env.NODE_ENV === 'development') {
      console.warn('Firebase Admin SDK not initialized. Falling back to Mock DB for simulation.');
      return mockDb;
    }
    throw new Error('Firebase Admin DB: SDK not initialized. Check server logs.');
  }
  
  return admin.firestore();
};

export const getAdminAuth = () => {
  const app = getFirebaseAdminApp();
  if (!app) throw new Error('Firebase Admin Auth: SDK not initialized. Check server logs.');
  return admin.auth();
};

// Legacy exports for partial compatibility, but recommend switching to getters
export const adminDb = admin.apps.length > 0 ? admin.firestore() : null!;
export const adminAuth = admin.apps.length > 0 ? admin.auth() : null!;
