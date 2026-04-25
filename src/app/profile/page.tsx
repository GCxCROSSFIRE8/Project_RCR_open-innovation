'use client';

import { useAuth } from '@/context/AuthContext';
import { Shield, Target, Wallet, Award, Clock, LogOut, MapPin } from 'lucide-react';

export default function ProfilePage() {
  const { profile, logout } = useAuth();

  if (!profile) return null;

  const stats = [
    { label: 'Total Requests', value: profile.totalRequests, icon: Target },
    { label: 'Validations', value: profile.totalValidations, icon: Shield },
    { label: 'Earnings', value: `₹${profile.earnings}`, icon: Wallet },
  ];

  const getTrustLabel = (score: number) => {
    if (score >= 90) return 'Expert';
    if (score >= 70) return 'Trusted';
    if (score >= 40) return 'Reliable';
    return 'Newbie';
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white p-6 md:p-12">
      <div className="max-w-3xl mx-auto space-y-10">
        
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Profile</h1>
          <button 
            onClick={logout}
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 dark:hover:text-white px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-800 transition-colors text-sm font-medium btn-press"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* User Card */}
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-8">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start text-center md:text-left">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-2xl bg-gray-200 dark:bg-gray-800 flex items-center justify-center text-3xl font-bold text-gray-500 dark:text-gray-400">
              {profile.name.charAt(0)}
            </div>

            <div className="flex-1 space-y-3">
              <div>
                <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                  <h2 className="text-2xl font-bold">{profile.name}</h2>
                  <span className="px-3 py-0.5 rounded-full text-xs font-semibold bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                    {getTrustLabel(profile.trustScore)}
                  </span>
                </div>
                <p className="text-gray-500 text-sm mt-1">{profile.email}</p>
              </div>

              <div className="flex flex-wrap gap-3 justify-center md:justify-start text-xs text-gray-500">
                <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
                  <Award className="w-3.5 h-3.5" />
                  Role: {profile.role}
                </div>
                <div className="flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-lg">
                  <Clock className="w-3.5 h-3.5" />
                  Joined {new Date(profile.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>

            {/* Trust Score */}
            <div className="relative flex items-center justify-center w-24 h-24">
               <svg className="w-full h-full transform -rotate-90">
                  <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-200 dark:text-gray-800" />
                  <circle cx="48" cy="48" r="42" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-900 dark:text-white" 
                    strokeDasharray={264}
                    strokeDashoffset={264 - (264 * profile.trustScore) / 100}
                    strokeLinecap="round"
                  />
               </svg>
               <div className="absolute flex flex-col items-center">
                  <span className="text-xl font-bold">{profile.trustScore}</span>
                  <span className="text-[9px] font-medium uppercase tracking-wider text-gray-500">Trust</span>
               </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.map((stat, i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-6 rounded-2xl hover-lift">
               <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-4 text-gray-500">
                  <stat.icon className="w-5 h-5" />
               </div>
               <p className="text-gray-500 text-xs font-medium uppercase tracking-wide mb-1">{stat.label}</p>
               <p className="text-2xl font-bold">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-6">
           <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
             <MapPin className="w-5 h-5 text-gray-400" />
             Verified Network Signals
           </h3>
           <div className="space-y-3">
             {profile.totalRequests > 0 ? (
               <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm font-medium border border-gray-200 dark:border-gray-700">
                  <p className="text-gray-900 dark:text-white mb-1">Recent Activity Detected</p>
                  <p className="text-[11px] text-gray-500 uppercase tracking-widest leading-none">Status: Live Sync Active</p>
               </div>
             ) : (
               <div className="p-4 bg-gray-100 dark:bg-gray-800 rounded-xl text-sm text-gray-500 text-center opacity-60 italic">
                 No verified signals in your immediate network yet.
               </div>
             )}
           </div>
        </div>

      </div>
    </div>
  );
}
