'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  auth,
  db,
  onAuthStateChanged,
  doc,
  onSnapshot,
  setDoc,
  signOut
} from '@/lib/firebase';
import { User } from 'firebase/auth';
import { usePathname, useRouter } from 'next/navigation';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'seeker' | 'validator';
  trustScore: number;
  totalRequests: number;
  totalValidations: number;
  earnings: number;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  logout: async () => {},
});

const MOCK_PROFILE: UserProfile = {
  id: "mock_user_001",
  name: "Demo User",
  email: "demo@localyze.ai",
  role: "seeker",
  trustScore: 85,
  totalRequests: 5,
  totalValidations: 2,
  earnings: 120,
  createdAt: new Date().toISOString(),
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // ─── SIMULATION MODE ─────────────────────────────────────────────
    // When running with mock Firebase keys, skip auth entirely and
    // inject a demo profile so the entire app is fully usable.
    const isMockMode = !process.env.NEXT_PUBLIC_FIREBASE_API_KEY ||
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY === 'mock_key';

    if (isMockMode) {
      console.warn('[Localyze] Simulation Mode: Auth bypassed with demo profile.');
      setProfile(MOCK_PROFILE);
      setUser(null);
      setLoading(false);
      return; // Skip Firebase listeners entirely
    }

    // ─── LIVE MODE ────────────────────────────────────────────────────
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const userRef = doc(db, 'users', firebaseUser.uid);
        const unsubProfile = onSnapshot(userRef, (snap) => {
          if (snap.exists()) {
            setProfile(snap.data() as UserProfile);
          } else if (firebaseUser.providerData.some(p => p.providerId === 'google.com')) {
            const newProfile: UserProfile = {
              id: firebaseUser.uid,
              name: firebaseUser.displayName || 'Anonymous',
              email: firebaseUser.email || '',
              role: 'seeker',
              trustScore: 50,
              totalRequests: 0,
              totalValidations: 0,
              earnings: 0,
              createdAt: new Date().toISOString(),
            };
            setDoc(userRef, newProfile);
          }
        });

        if (firebaseUser.emailVerified && pathname === '/auth') {
          router.push('/dashboard');
        }
        setLoading(false);
        return () => unsubProfile();
      } else {
        setProfile(null);
        setLoading(false);
        if (pathname !== '/auth' && pathname !== '/') {
          router.push('/auth');
        }
      }
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const logout = async () => {
    if (auth) await signOut(auth);
    router.push('/auth');
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout }}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-gray-500 text-sm font-medium">Initializing Localyze...</p>
          </div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
