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

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      
      if (user) {
        // ... (existing logic)
        const userRef = doc(db, 'users', user.uid);
        const unsubscribeProfile = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
             // ... handle new profile creation
             if (user.providerData.some(p => p.providerId === 'google.com')) {
               const newProfile: UserProfile = {
                 id: user.uid,
                 name: user.displayName || 'Anonymous User',
                 email: user.email || '',
                 role: 'seeker',
                 trustScore: 50,
                 totalRequests: 0,
                 totalValidations: 0,
                 earnings: 0,
                 createdAt: new Date().toISOString(),
               };
               setDoc(userRef, newProfile);
            }
          }
        });

        if (user.emailVerified && pathname === '/auth') {
          router.push('/dashboard');
        }
        
        return () => unsubscribeProfile();
      } else {
        setProfile(null);
        // Protect all routes except Landing (/) and Auth (/auth)
        if (pathname !== '/auth' && pathname !== '/') {
          router.push('/auth');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const logout = async () => {
    if (auth) {
      await signOut(auth);
    }
    router.push('/auth');
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, logout }}>
      {loading ? (
        <div className="min-h-screen flex items-center justify-center bg-gray-950">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
