'use client';

import Link from 'next/link';
import { ShieldAlert, MapPin, Target, Zap, ChevronRight, Globe, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-950 text-white selection:bg-blue-500/30 overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
                <ShieldAlert className="w-6 h-6 text-white" />
             </div>
             <span className="text-2xl font-black tracking-tighter">Localyze.</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm font-bold text-gray-400 uppercase tracking-widest">
             <a href="#features" className="hover:text-white transition-colors">Features</a>
             <a href="#network" className="hover:text-white transition-colors">Network</a>
             <Link href="/auth" className="text-white hover:text-blue-500 transition-colors">Login</Link>
          </div>
          <Link 
            href="/auth?mode=signup" 
            className="bg-white text-black px-6 py-2.5 rounded-full font-black text-sm uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all active:scale-95"
          >
            Join Network
          </Link>
        </div>
      </nav>

      <main>
        {/* Hero Section */}
        <section className="relative pt-40 pb-20 px-6">
          {/* Animated background glow */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[150px] rounded-full pointer-events-none animate-pulse"></div>
          <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none"></div>

          <div className="max-w-7xl mx-auto text-center space-y-8 relative z-10">
            <div className="inline-flex items-center gap-2 bg-blue-900/30 border border-blue-500/30 px-4 py-2 rounded-full text-blue-400 text-xs font-black uppercase tracking-widest animate-in fade-in slide-in-from-top-4 duration-700">
               <Zap className="w-3 h-3 fill-current" />
               v1.0 is now live
            </div>
            <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.95] animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
               REAL-TIME PAID <br />
               <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500">
                  CRISIS VERIFICATION
               </span>
            </h1>
            <p className="max-w-2xl mx-auto text-gray-400 text-lg md:text-xl font-medium leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              Transform local eyes into global truth. A decentralized network powered by AI to verify emergencies, reduce panic, and reward accuracy.
            </p>
            <div className="flex flex-col md:flex-row items-center justify-center gap-4 pt-4 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
              <Link 
                href="/dashboard" 
                className="group relative px-10 py-5 bg-blue-600 rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-900/40 flex items-center gap-2"
              >
                Launch Dashboard
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link 
                href="/whitepaper"
                className="px-10 py-5 bg-gray-900 border border-white/10 rounded-2xl font-black text-lg uppercase tracking-widest hover:bg-gray-800 transition-all text-center"
              >
                The Whitepaper
              </Link>
            </div>
          </div>
        </section>

        {/* Stats Grid */}
        <section id="features" className="py-20 px-6 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            {[
              { label: 'Precision Location', desc: '500m mandatory proximity check ensures validators are on the ground.', icon: MapPin },
              { label: 'AI Validation', desc: 'Gemini-powered risk assessment classifies and summarizes every report.', icon: Zap },
              { label: 'Economic Trust', desc: 'Financial rewards tied to truth. Penalties for misinformation.', icon: ShieldCheck },
            ].map((feature, i) => (
              <div key={i} className="bg-gray-900/50 border border-white/5 p-10 rounded-[32px] hover:bg-gray-900 transition-all group">
                <div className="w-14 h-14 bg-gray-950 rounded-2xl flex items-center justify-center mb-8 border border-white/10 group-hover:scale-110 transition-transform">
                   <feature.icon className="w-7 h-7 text-blue-500" />
                </div>
                <h3 className="text-2xl font-black mb-4 tracking-tight">{feature.label}</h3>
                <p className="text-gray-500 font-medium leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Global Network Visual */}
        <section id="network" className="py-20 px-6 text-center border-t border-white/5 bg-gradient-to-b from-gray-950 to-blue-950/20">
           <div className="max-w-4xl mx-auto space-y-6">
              <Globe className="w-20 h-20 text-blue-500/20 mx-auto mb-4" />
              <h2 className="text-4xl md:text-5xl font-black tracking-tight italic">TRUSTED BY 14.5K VOLUNTEERS</h2>
              <p className="text-gray-500 font-black text-sm uppercase tracking-[0.3em]">Building the future of community resilience</p>
           </div>
        </section>
      </main>

      <footer className="py-20 px-6 border-t border-white/5 text-center text-gray-600">
         <p className="text-sm font-bold uppercase tracking-widest">© 2026 Localyze AI. Distributed Crisis Verification.</p>
      </footer>
    </div>
  );
}
