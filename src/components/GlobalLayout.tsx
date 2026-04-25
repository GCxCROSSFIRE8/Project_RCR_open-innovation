'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Map, ShieldCheck, User, Compass } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function GlobalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { profile } = useAuth();
  
  // Do not show layout on auth or landing page
  if (!profile || pathname === '/' || pathname === '/auth') {
    return <>{children}</>;
  }

  const navItems = [
    { label: 'Map', icon: Map, path: '/dashboard' },
    { label: 'Validate', icon: ShieldCheck, path: '/validator' },
    { label: 'Profile', icon: User, path: '/profile' },
  ];

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden relative">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-[#0a0a0a] z-50">
        <div className="p-6 flex items-center gap-2">
          <div className="w-8 h-8 bg-gray-900 dark:bg-white rounded-lg flex items-center justify-center">
            <Compass className="w-5 h-5 text-white dark:text-gray-900" />
          </div>
          <span className="text-lg font-bold tracking-tight">Localyze</span>
        </div>
        
        <nav className="flex-1 px-4 py-6 space-y-2">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover-lift ${
                  isActive 
                    ? 'bg-gray-100 dark:bg-gray-900 text-gray-900 dark:text-white font-semibold' 
                    : 'text-gray-500 font-medium hover:bg-gray-50 dark:hover:bg-gray-900/50'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? '' : ''}`} />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 h-full relative overflow-y-auto w-full">
        {children}
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-gray-800 z-50 pb-safe">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => {
            const isActive = pathname === item.path;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex flex-col items-center justify-center w-full h-full space-y-1 btn-press ${
                  isActive ? 'text-gray-900 dark:text-white' : 'text-gray-400'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-[10px] font-bold uppercase tracking-wider">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
