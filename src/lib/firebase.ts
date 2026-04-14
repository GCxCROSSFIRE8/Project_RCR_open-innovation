import { initializeApp, getApps, getApp } from 'firebase/app';
import { 
  getFirestore, 
  doc as firestoreDoc, 
  setDoc as firestoreSetDoc, 
  getDoc as firestoreGetDoc, 
  updateDoc as firestoreUpdateDoc,
  onSnapshot as firestoreOnSnapshot,
  collection as firestoreCollection
} from 'firebase/firestore';
import { 
  getAuth, 
  GoogleAuthProvider, 
  onAuthStateChanged as firebaseOnAuthStateChanged,
  signInWithEmailAndPassword as firebaseSignIn,
  createUserWithEmailAndPassword as firebaseCreateUser,
  signOut as firebaseSignOut,
  sendEmailVerification as firebaseSendVerification,
  sendPasswordResetEmail as firebaseSendReset
} from 'firebase/auth';
import { mockAuth, mockDb, mockGoogleProvider } from './mock-services';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize Firebase only if it hasn't been initialized and config is valid
const hasValidConfig = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

let app: any;
try {
  if (hasValidConfig) {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  }
} catch (e) {
  console.error("Firebase Initialization Error:", e);
}

// Export real services if app exists, otherwise export mocks
export const db = app ? getFirestore(app) : (mockDb as any);
export const auth = app ? getAuth(app) : (mockAuth as any);
export const googleProvider = app ? new GoogleAuthProvider() : (mockGoogleProvider as any);

// --- UNIFIED WRAPPERS ---

/**
 * These wrappers automatically route to either real Firebase or our Persistent Simulator
 * depending on whether the configuration keys are present.
 */

export const onAuthStateChanged = (authInstance: any, callback: any) => {
  return app ? firebaseOnAuthStateChanged(authInstance, callback) : mockAuth.onAuthStateChanged(callback);
};

export const signInWithEmailAndPassword = (authInstance: any, email: string, pass: string) => {
  return app ? firebaseSignIn(authInstance, email, pass) : mockAuth.signInWithEmailAndPassword(authInstance, email, pass);
};

export const createUserWithEmailAndPassword = (authInstance: any, email: string, pass: string) => {
  return app ? firebaseCreateUser(authInstance, email, pass) : mockAuth.createUserWithEmailAndPassword(authInstance, email, pass);
};

export const signOut = (authInstance: any) => {
  return app ? firebaseSignOut(authInstance) : mockAuth.signOut();
};

export const sendEmailVerification = (user: any) => {
  return app ? firebaseSendVerification(user) : Promise.resolve();
};

export const sendPasswordResetEmail = (authInstance: any, email: string) => {
  return app ? firebaseSendReset(authInstance, email) : Promise.resolve();
};

// Firestore Wrappers
export const doc = (dbInstance: any, collection: string, id: string) => {
  return app ? firestoreDoc(dbInstance, collection, id) : mockDb.doc(dbInstance, collection, id);
};

export const collection = (dbInstance: any, name: string) => {
  return app ? firestoreCollection(dbInstance, name) : mockDb.collection(dbInstance, name);
};

export const query = (ref: any, ...constraints: any[]) => {
  return app ? firestoreQuery(ref, ...constraints) : ref;
};

export const setDoc = (docRef: any, data: any) => {
  return app ? firestoreSetDoc(docRef, data) : mockDb.setDoc(docRef, data);
};

export const getDoc = (docRef: any) => {
  return app ? firestoreGetDoc(docRef) : mockDb.getDoc(docRef);
};

export const updateDoc = (docRef: any, data: any) => {
  return app ? firestoreUpdateDoc(docRef, data) : mockDb.updateDoc(docRef, data);
};

export const onSnapshot = (ref: any, callback: any) => {
  return app ? firestoreOnSnapshot(ref, callback) : mockDb.onSnapshot(ref, callback);
};

