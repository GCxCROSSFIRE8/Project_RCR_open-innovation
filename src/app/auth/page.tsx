'use client';

import { useState, useEffect } from 'react';
import { 
  auth, 
  googleProvider, 
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  doc,
  setDoc,
  signInWithPopup
} from '@/lib/firebase';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import { ShieldAlert, Mail, Lock, User as UserIcon, LogIn, Loader2, AlertTriangle, Cpu } from 'lucide-react';

function AuthContent() {
  const isAuthAvailable = !!auth;
  const [isLogin, setIsLogin] = useState(true);
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');

  useEffect(() => {
    if (mode === 'signup') {
      setIsLogin(false);
    }
  }, [mode]);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const router = useRouter();

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      if (isLogin) {
        // Login Logic
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        if (!userCredential.user.emailVerified) {
          setError('Please verify your email address before logging in.');
          setIsVerifying(true);
        } else {
          router.push('/dashboard');
        }
      } else {
        // Signup Logic
        if (password !== confirmPassword) throw new Error('Passwords do not match');
        
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 1. Send Verification Email
        await sendEmailVerification(user);
        
        // 2. Create Firestore Profile
        await setDoc(doc(db, 'users', user.uid), {
          id: user.uid,
          name,
          email,
          role: 'seeker',
          trustScore: 50,
          totalRequests: 0,
          totalValidations: 0,
          earnings: 0,
          createdAt: new Date().toISOString(),
        });

        setIsVerifying(true);
        setMessage('Verification email sent! Please check your inbox.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const result = await signInWithPopup(auth, googleProvider);
      // Profile creation is handled in AuthContext for Google logins
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address to reset password.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      setMessage('Password reset link sent to your email.');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center p-4">
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 rounded-2xl max-w-md w-full text-center space-y-6">
           <div className="w-14 h-14 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto">
             <Mail className="w-7 h-7 text-gray-600 dark:text-gray-400" />
           </div>
           <h2 className="text-2xl font-bold">Check Your Email</h2>
           <p className="text-gray-500">We've sent a verification link to <span className="text-gray-900 dark:text-white font-medium">{email}</span>. Please verify your account to continue.</p>
           <button 
             onClick={() => setIsVerifying(false)}
             className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold py-3.5 rounded-xl hover:opacity-90 transition-opacity btn-press"
           >
             Proceed to Login
           </button>
           <button 
             onClick={handleEmailAuth}
             className="text-gray-500 hover:text-gray-300 text-sm font-medium"
           >
             Resend verification email
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] flex items-center justify-center p-4">
      {/* Clean background — no gradient blurs */}


      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gray-900 dark:bg-white rounded-xl mb-4">
            <ShieldAlert className="w-7 h-7 text-white dark:text-gray-900" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Localyze</h1>
          <p className="text-gray-500 mt-1 text-sm">Secure AI Crisis Verification</p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-2 rounded-2xl">
          {/* Tabs */}
          <div className="flex p-1 bg-gray-950/50 rounded-2xl mb-6">
            <button 
              onClick={() => setIsLogin(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${isLogin ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              <LogIn className="w-4 h-4" />
              Login
            </button>
            <button 
              onClick={() => setIsLogin(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold transition-all ${!isLogin ? 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white shadow-sm' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              <UserIcon className="w-4 h-4" />
              Signup
            </button>
          </div>

          <div className="px-6 pb-6 pt-2">
            <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl flex items-center gap-4">
               <div className="w-9 h-9 rounded-lg bg-gray-900 dark:bg-white flex items-center justify-center shrink-0">
                  <Cpu className="w-4 h-4 text-white dark:text-gray-900" />
               </div>
               <div>
                 <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide leading-none mb-1">Simulation Mode</p>
                 <p className="text-[11px] text-gray-500 leading-tight">Persistent local environment. No cloud keys required.</p>
               </div>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-4">
              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">Full Name</label>
                  <div className="relative group">
                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="text"
                      placeholder="John Doe"
                      required
                      className="w-full bg-gray-950 border border-gray-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">Email Address</label>
                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="email"
                    placeholder="name@company.com"
                    required
                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3.5 pl-11 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-gray-400 outline-none transition-all"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">Secure Password</label>
                <div className="relative group">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    required
                    className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3.5 pl-11 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-600 focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600 focus:border-gray-400 outline-none transition-all"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500 ml-2">Confirm Password</label>
                  <div className="relative group">
                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                    <input
                      type="password"
                      placeholder="••••••••"
                      required
                      className="w-full bg-gray-950 border border-gray-800 rounded-2xl py-4 pl-12 pr-4 text-white placeholder:text-gray-700 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {isLogin && (
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    className="text-xs font-bold text-gray-500 hover:text-blue-500 transition-colors"
                  >
                    Forgot Password?
                  </button>
                </div>
              )}

              {/* Display messages */}
              {error && <p className="text-red-500 text-xs font-bold px-2 bg-red-500/10 py-2 rounded-lg border border-red-500/20 animate-pulse">{error}</p>}
              {message && <p className="text-green-500 text-xs font-bold px-2 bg-green-500/10 py-2 rounded-lg border border-green-500/20">{message}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold py-3.5 rounded-xl transition-opacity hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2 text-sm mt-4 btn-press"
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : isLogin ? 'Sign In' : 'Create Account'}
              </button>
            </form>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-800"></div></div>
              <div className="relative flex justify-center text-xs uppercase"><span className="bg-gray-900 px-4 text-gray-500 font-black tracking-widest">Or continue with</span></div>
            </div>

            <div className="grid grid-cols-1 gap-4 text-white">
              <button
                type="button"
                onClick={handleGoogleLogin}
                className="flex items-center justify-center gap-3 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 py-3.5 rounded-xl transition-colors font-medium btn-press"
              >
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center p-1 group-hover:scale-110 transition-transform">
                  <svg viewBox="0 0 24 24" className="w-full h-full"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                </div>
                Google Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
