'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Plus, User, Award, ShieldCheck, FlaskConical, AlertTriangle } from 'lucide-react';
import Link from 'next/link';
import CrisisMap from '@/components/Map';
import CreateRequestModal from '@/components/CreateRequestModal';

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { profile } = useAuth();
  const [isLiveMode, setIsLiveMode] = useState(false);
  
  // Use static coordinates for the demo (Delhi)
  const defaultLat = 28.6139;
  const defaultLng = 77.2090;

  useEffect(() => {
    // Basic check for mode
    const hasKeys = !!(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
    setIsLiveMode(hasKeys);
  }, []);

  if (!profile) return null;

  return (
    <main className="relative w-full h-screen bg-gray-900 overflow-hidden">
      {/* Dynamic Mode Badge */}
      <div className="absolute top-24 left-6 z-20 animate-in slide-in-from-left duration-500">
        {isLiveMode ? (
          <div className="flex items-center gap-2 bg-green-900/40 backdrop-blur-md border border-green-500/50 px-4 py-2 rounded-full text-green-400 text-xs font-black uppercase tracking-widest shadow-lg">
             <ShieldCheck className="w-4 h-4" />
             Live Payments Active
          </div>
        ) : (
          <div className="flex items-center gap-2 bg-orange-900/40 backdrop-blur-md border border-orange-500/50 px-4 py-2 rounded-full text-orange-400 text-xs font-black uppercase tracking-widest shadow-lg">
             <FlaskConical className="w-4 h-4" />
             Simulation Mode Active
          </div>
        )}
      </div>

      {/* Header overlay */}
      <div className="absolute top-0 left-0 right-0 z-10 p-6 flex justify-between items-start bg-gradient-to-b from-gray-950 to-transparent pointer-events-none">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center text-white font-black italic text-xl shadow-lg shadow-blue-900/40">
            {profile.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl font-black tracking-tighter text-white">
              Localyze <span className="text-blue-500">.</span>
            </h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1">
              <Award className="w-3 h-3 text-blue-500" />
              Score: {profile.trustScore}
            </p>
          </div>
        </div>

        <Link 
          href="/profile" 
          className="pointer-events-auto bg-gray-900/50 backdrop-blur-md border border-gray-800 hover:bg-gray-800 p-3 rounded-2xl transition-all shadow-xl text-gray-400 hover:text-white"
        >
          <User className="w-6 h-6" />
        </Link>
      </div>

      {/* Mapbox Layer */}
      <CrisisMap />

      {/* Floating Action Button */}
      <div className="absolute bottom-10 right-10 z-20 flex flex-col items-end gap-4">
        {!isLiveMode && (
          <div className="bg-gray-900/80 backdrop-blur-md p-3 rounded-2xl border border-gray-800 text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] max-w-[200px] text-right">
             Reviewing in sandbox environment. All payments are simulated.
          </div>
        )}
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white p-5 rounded-3xl shadow-2xl shadow-blue-500/50 hover:scale-105 active:scale-95 transition-all flex items-center justify-center group"
        >
          <Plus className="w-8 h-8 group-hover:rotate-90 transition-transform duration-300" />
        </button>
      </div>

      {/* Submitting Request Modal - Now explicitly controlled by isModalOpen */}
      <CreateRequestModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        userLat={defaultLat} 
        userLng={defaultLng} 
      />
    </main>
  );
}
