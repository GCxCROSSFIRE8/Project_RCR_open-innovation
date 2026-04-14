'use client';

import Link from 'next/link';
import { ShieldAlert, ChevronLeft, MapPin, Zap, ShieldCheck, Cpu, Globe, Lock } from 'lucide-react';

export default function Whitepaper() {
  return (
    <div className="min-h-screen bg-gray-950 text-white selection:bg-blue-500/30">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-white/5 bg-gray-950/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/40">
                <ShieldAlert className="w-6 h-6 text-white" />
             </div>
             <span className="text-2xl font-black tracking-tighter">Localyze Whitepaper.</span>
          </div>
          <Link href="/" className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors group">
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-bold uppercase tracking-widest">Back to Overview</span>
          </Link>
        </div>
      </nav>

      <main className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto space-y-20">
          
          {/* Header */}
          <div className="space-y-6">
            <div className="inline-flex items-center gap-2 bg-blue-900/30 border border-blue-500/30 px-4 py-2 rounded-full text-blue-400 text-xs font-black uppercase tracking-widest">
               Platform Architecture v1.0
            </div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter leading-none">
              The Protocol of <br />
              <span className="text-blue-500">Decentralized Truth.</span>
            </h1>
            <p className="text-gray-400 text-xl font-medium leading-relaxed">
              Localyze uses a hybrid AI-Geospatial consensus mechanism to solve the "Last-Mile Verification" problem in disaster management.
            </p>
          </div>

          {/* Core Pillars */}
          <div className="grid grid-cols-1 gap-12">
            
            {/* Pillar 1 */}
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-900/20 rounded-2xl flex items-center justify-center border border-blue-500/20">
                  <MapPin className="w-6 h-6 text-blue-500" />
                </div>
                <h2 className="text-3xl font-black tracking-tight">Geospatial Proof-of-Presence</h2>
              </div>
              <p className="text-gray-400 text-lg leading-relaxed">
                Verification is not just digital—it's physical. The Localyze protocol enforces a mandatory **500-meter proximity radius** for all validators. By cross-referencing GPS telemetry and timestamped data, we ensure that every verification is backed by someone on the ground.
              </p>
              <div className="bg-gray-900 border border-white/5 p-8 rounded-[32px] space-y-4">
                 <div className="flex justify-between items-center bg-gray-950 p-4 rounded-2xl border border-white/5">
                    <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Validation Metric</span>
                    <span className="text-blue-500 font-black tracking-tighter text-lg">Proximity &lt; 500m</span>
                 </div>
                 <div className="flex justify-between items-center bg-gray-950 p-4 rounded-2xl border border-white/5">
                    <span className="text-gray-500 font-bold uppercase tracking-widest text-xs">Consensus Goal</span>
                    <span className="text-green-500 font-black tracking-tighter text-lg">Truth Consensus</span>
                 </div>
              </div>
            </section>

            {/* Pillar 2 */}
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-indigo-900/20 rounded-2xl flex items-center justify-center border border-indigo-500/20">
                  <Zap className="w-6 h-6 text-indigo-500" />
                </div>
                <h2 className="text-3xl font-black tracking-tight">AI-Assisted Risk Profiling</h2>
              </div>
              <p className="text-gray-400 text-lg leading-relaxed">
                Every report is instantly analyzed by **Gemini AI**. The system extracts key features like severity, immediate needs, and potential cascades. This data is used to generate a Risk Profile (HIGH, MEDIUM, LOW) that guides emergency responders and determines seeker costs.
              </p>
            </section>

            {/* Pillar 3 */}
            <section className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-emerald-900/20 rounded-2xl flex items-center justify-center border border-emerald-500/20">
                  <ShieldCheck className="w-6 h-6 text-emerald-500" />
                </div>
                <h2 className="text-3xl font-black tracking-tight">The Economic Incentive</h2>
              </div>
              <p className="text-gray-400 text-lg leading-relaxed">
                We believe in the power of paid verification. 
                - **Seekers** pay a ₹50 fee to post a verified alert.
                - **Validators** who verify a request earn **₹10** and **+10 Trust Points**.
                - **Platform Commission** (₹40) funds the infrastructure and crisis response funds.
              </p>
            </section>
          </div>

          {/* Footer Call to Action */}
          <div className="pt-20 border-t border-white/5 text-center space-y-8">
             <h2 className="text-4xl font-black tracking-tighter italic uppercase">Join the Decentralized Truth Network</h2>
             <Link 
               href="/auth?mode=signup" 
               className="inline-flex px-12 py-5 bg-blue-600 rounded-3xl font-black text-xl uppercase tracking-widest hover:bg-blue-700 transition-all shadow-2xl shadow-blue-900/40"
             >
                Start Validating Now
             </Link>
          </div>

        </div>
      </main>

      <footer className="py-20 px-6 border-t border-white/5 text-center text-gray-700 font-black text-sm uppercase tracking-widest">
         Localyze AI © 2026. All Rights Reserved.
      </footer>
    </div>
  );
}
