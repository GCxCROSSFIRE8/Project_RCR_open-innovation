'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Plus, ShieldCheck, FlaskConical, Award } from 'lucide-react';
import CrisisMap from '@/components/Map';
import CreateRequestModal from '@/components/CreateRequestModal';
import NewsFeed from '@/components/NewsFeed';

import { useGeolocation } from '@/lib/hooks';
import { SimulationEngine, SimulationItem } from '@/lib/simulation-engine';
import { db, collection, setDoc, doc } from '@/lib/firebase';

export default function DashboardPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { profile } = useAuth();
  const { location } = useGeolocation();
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [radius, setRadius] = useState(10);
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  const userLat = location?.lat || 28.6139;
  const userLng = location?.lng || 77.2090;

  useEffect(() => {
    const hasKeys = !!(process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID && process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID !== 'mock_rzp_key');
    setIsLiveMode(hasKeys);

    // ─── SIMULATION LOOP ─────────────────────────────────────────────
    // Generate new reports periodically to make the app feel alive
    if (!hasKeys) {
      const engine = new SimulationEngine(userLat, userLng);
      
      const interval = setInterval(() => {
        const newItems = engine.generateItems(1);
        newItems.forEach(async (item) => {
          const docRef = doc(db, 'requests', item.id);
          await setDoc(docRef, {
            ...item,
            riskLevel: item.category === 'CRITICAL' ? 'HIGH' : item.category === 'IMPORTANT' ? 'MEDIUM' : 'LOW',
            createdAt: item.timestamp,
            isSimulation: true
          });
        });
      }, 15000); // New event every 15s

      return () => clearInterval(interval);
    }
  }, [userLat, userLng]);

  if (!profile) return null;

  return (
    <div className="relative w-full h-full bg-white dark:bg-[#0a0a0a] overflow-hidden flex flex-col md:flex-row">
      {/* Map Area */}
      <div className="flex-1 relative w-full h-full">
        {/* Dynamic Mode Badge */}
        <div className="absolute top-6 left-6 z-20 flex gap-2">
          {isLiveMode ? (
            <div className="flex items-center gap-2 bg-white/90 dark:bg-black/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 px-3 py-1.5 rounded-lg text-gray-900 dark:text-white text-xs font-medium shadow-sm">
               <ShieldCheck className="w-3.5 h-3.5" />
               Live
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-white/90 dark:bg-black/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 px-3 py-1.5 rounded-lg text-gray-600 dark:text-gray-400 text-xs font-medium shadow-sm">
               <FlaskConical className="w-3.5 h-3.5" />
               Sandbox
            </div>
          )}
          <div className="flex items-center gap-2 bg-white/90 dark:bg-black/80 backdrop-blur-sm border border-gray-200 dark:border-gray-800 px-3 py-1.5 rounded-lg text-gray-900 dark:text-white text-xs font-medium shadow-sm">
             <Award className="w-3.5 h-3.5 text-gray-500" />
             Trust: {profile.trustScore}
          </div>
        </div>

        {/* Mapbox Layer */}
        <div className="absolute inset-0">
          <CrisisMap />
        </div>

        {/* Floating Action Button */}
        <div className="absolute bottom-6 right-6 z-20 flex flex-col items-end gap-4 pointer-events-none">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="pointer-events-auto bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-4 rounded-xl shadow-lg hover-lift btn-press flex items-center justify-center group"
          >
            <Plus className="w-7 h-7 group-hover:rotate-90 transition-transform duration-200" />
          </button>
        </div>
      </div>

      {/* News Feed Sidebar */}
      <div className="hidden lg:block h-full z-10 w-80 shadow-[-10px_0_20px_rgba(0,0,0,0.05)] dark:shadow-none">
        <NewsFeed 
          userLat={userLat} 
          userLng={userLng} 
          radius={radius} 
          onRadiusChange={setRadius} 
          isSubscribed={isSubscribed}
          onSubscriptionToggle={() => setIsSubscribed(!isSubscribed)}
        />
      </div>

      <CreateRequestModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        userLat={userLat} 
        userLng={userLng} 
      />
    </div>
  );
}
