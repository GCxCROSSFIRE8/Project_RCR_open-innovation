'use client';

import Link from 'next/link';
import { ShieldAlert, MapPin, Zap, ChevronRight, ShieldCheck } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 border-b border-gray-200 dark:border-gray-800 bg-white/90 dark:bg-[#0a0a0a]/90 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-white dark:text-gray-900" />
             </div>
             <span className="text-xl font-bold tracking-tight">Localyze</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
             <a href="#features" className="hover:text-gray-900 dark:hover:text-white transition-colors">Features</a>
             <Link href="/auth" className="hover:text-gray-900 dark:hover:text-white transition-colors">Login</Link>
          </div>
          <Link 
            href="/auth?mode=signup" 
            className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 px-5 py-2 rounded-lg font-semibold text-sm hover:opacity-90 transition-opacity btn-press"
          >
            Join Network
          </Link>
        </div>
      </nav>

      <main>
        {/* Hero */}
        <section className="pt-32 pb-16 px-6">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Real-time crisis intelligence</p>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
               Verify crises locally.<br />
               <span className="text-gray-400 dark:text-gray-500">Trust what's real.</span>
            </h1>
            <p className="max-w-xl mx-auto text-gray-500 text-lg leading-relaxed">
              A decentralized network where local users report, AI classifies, and validators confirm — producing trusted, real-time local intelligence.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
              <Link 
                href="/dashboard" 
                className="group px-8 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-lg font-semibold text-base hover:opacity-90 transition-opacity flex items-center gap-2 btn-press"
              >
                Open Dashboard
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link 
                href="/whitepaper"
                className="px-8 py-3.5 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg font-semibold text-base hover:bg-gray-200 dark:hover:bg-gray-800 transition-colors btn-press"
              >
                Read Whitepaper
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-16 px-6 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { label: 'Precision Location', desc: '500m proximity check ensures validators are physically present at the scene.', icon: MapPin },
              { label: 'AI Classification', desc: 'Multi-agent pipeline triages risk, detects spam, and categorizes every report.', icon: Zap },
              { label: 'Trust Network', desc: 'Weighted consensus from multiple validators. Reputation-based rewards and penalties.', icon: ShieldCheck },
            ].map((feature, i) => (
              <div key={i} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-8 rounded-2xl hover-lift">
                <div className="w-10 h-10 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center mb-6 border border-gray-200 dark:border-gray-700">
                   <feature.icon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </div>
                <h3 className="text-lg font-bold mb-2">{feature.label}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Network */}
        <section className="py-16 px-6 text-center border-t border-gray-200 dark:border-gray-800">
           <div className="max-w-3xl mx-auto space-y-3">
              <h2 className="text-2xl md:text-3xl font-bold tracking-tight">Community-powered verification</h2>
              <p className="text-gray-500 text-sm">AI-assisted. Human-verified. Locally trusted.</p>
           </div>
        </section>
      </main>

      <footer className="py-12 px-6 border-t border-gray-200 dark:border-gray-800 text-center">
         <p className="text-xs text-gray-400">© 2026 Localyze. Distributed Crisis Verification.</p>
      </footer>
    </div>
  );
}
