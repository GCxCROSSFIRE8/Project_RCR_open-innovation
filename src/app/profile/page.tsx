'use client';

import { useAuth } from '@/context/AuthContext';
import { Shield, Target, Wallet, Award, Clock, LogOut, Edit2, ChevronLeft, MapPin } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { profile, logout } = useAuth();

  if (!profile) return null;

  const stats = [
    { label: 'Total Requests', value: profile.totalRequests, icon: Target, color: 'text-blue-500' },
    { label: 'Validations', value: profile.totalValidations, icon: Shield, color: 'text-green-500' },
    { label: 'Total Earnings', value: `₹${profile.earnings}`, icon: Wallet, color: 'text-amber-500' },
  ];

  const getTrustLabel = (score: number) => {
    if (score >= 90) return { label: 'Expert', color: 'bg-indigo-600', text: 'text-indigo-100' };
    if (score >= 70) return { label: 'Trusted', color: 'bg-green-600', text: 'text-green-100' };
    if (score >= 40) return { label: 'Reliable', color: 'bg-blue-600', text: 'text-blue-100' };
    return { label: 'Newbie', color: 'bg-gray-600', text: 'text-gray-100' };
  };

  const trust = getTrustLabel(profile.trustScore);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 md:p-12">
      <div className="max-w-4xl mx-auto space-y-12">
        
        {/* Navigation */}
        <div className="flex justify-between items-center">
          <Link href="/dashboard" className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors group">
            <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center group-hover:bg-gray-800">
              <ChevronLeft className="w-5 h-5" />
            </div>
            <span className="font-bold uppercase tracking-widest text-xs">Back to Map</span>
          </Link>
          <button 
            onClick={logout}
            className="flex items-center gap-2 bg-red-900/20 hover:bg-red-900/40 text-red-500 px-5 py-2.5 rounded-xl border border-red-900/50 transition-all font-bold text-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        {/* User Card */}
        <div className="relative group">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 blur-[80px] opacity-10 group-hover:opacity-20 transition-opacity rounded-full"></div>
          <div className="relative bg-gray-900 border border-gray-800 rounded-[32px] p-8 md:p-12 shadow-2xl overflow-hidden">
            
            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
              {/* Avatar Placeholder */}
              <div className="w-32 h-32 rounded-[2.5rem] bg-gradient-to-tr from-blue-600 to-indigo-600 p-1">
                <div className="w-full h-full bg-gray-900 rounded-[2.3rem] flex items-center justify-center text-5xl font-black italic text-blue-500 uppercase tracking-tighter">
                  {profile.name.charAt(0)}
                </div>
              </div>

              <div className="flex-1 space-y-4">
                <div>
                  <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                    <h2 className="text-4xl font-black tracking-tight">{profile.name}</h2>
                    <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${trust.color} ${trust.text} shadow-lg shadow-indigo-900/20`}>
                      {trust.label}
                    </span>
                  </div>
                  <p className="text-gray-500 font-medium mt-1">{profile.email}</p>
                </div>

                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <div className="flex items-center gap-2 bg-gray-950 px-4 py-2 rounded-xl border border-gray-800">
                    < Award className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-bold uppercase tracking-wider">Role: {profile.role}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-gray-950 px-4 py-2 rounded-xl border border-gray-800">
                    < Clock className="w-4 h-4 text-gray-500" />
                    <span className="text-xs font-bold uppercase tracking-wider">Joined {new Date(profile.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              {/* Trust Score Circle */}
              <div className="relative flex items-center justify-center w-32 h-32">
                 <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-800" />
                    <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-blue-500" 
                      strokeDasharray={364.4}
                      strokeDashoffset={364.4 - (364.4 * profile.trustScore) / 100}
                    />
                 </svg>
                 <div className="absolute flex flex-col items-center">
                    <span className="text-3xl font-black">{profile.trustScore}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">Trust</span>
                 </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {stats.map((stat, i) => (
            <div key={i} className="bg-gray-900 border border-gray-800 p-8 rounded-3xl group hover:border-blue-500/50 transition-all hover:bg-gray-800/50">
               <div className={`w-12 h-12 rounded-2xl bg-gray-950 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
               </div>
               <p className="text-gray-500 font-bold text-xs uppercase tracking-[0.2em] mb-1">{stat.label}</p>
               <p className="text-4xl font-black tracking-tight">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Activity Summary */}
        <div className="bg-gray-900 border border-gray-800 rounded-3xl p-8">
           <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
                <MapPin className="w-6 h-6 text-blue-500" />
                Live Network Activity
              </h3>
              <button className="text-blue-500 hover:text-blue-400 font-bold text-xs uppercase tracking-widest">Refresh Feed</button>
           </div>
           
           <div className="space-y-4 opacity-50">
              <div className="p-4 bg-gray-950 rounded-2xl border border-gray-800 flex justify-between items-center">
                <div className="flex gap-4 items-center">
                   <div className="w-10 h-10 rounded-full bg-gray-900 border border-gray-800"></div>
                   <div>
                     <p className="text-sm font-bold">System Log</p>
                     <p className="text-xs text-gray-600">Syncing real-time global crisis events...</p>
                   </div>
                </div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              </div>
           </div>
        </div>

      </div>
    </div>
  );
}
