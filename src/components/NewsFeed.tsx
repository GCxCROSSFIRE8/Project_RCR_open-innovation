'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Info, Bell, MapPin, Lock, Zap, Clock, ShieldAlert } from 'lucide-react';
import { db, collection, onSnapshot } from '@/lib/firebase';
import * as geofire from 'geofire-common';

interface NewsItem {
  id: string;
  title?: string;
  category: 'CRITICAL' | 'IMPORTANT' | 'GENERAL';
  riskLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  text: string;
  summary?: string;
  full_report?: string;
  lat: number;
  lng: number;
  timestamp: Date;
  isSpam: boolean;
  distance?: number;
  clusterCount?: number;
  status?: string;
  severity_score?: number;
  images?: { url: string; caption: string }[];
  cluster_id?: string;
  is_breaking?: boolean;
  distance_km?: number;
}

interface NewsFeedProps {
  userLat: number;
  userLng: number;
  radius: number;
  onRadiusChange: (val: number) => void;
  isSubscribed?: boolean;
  onSubscriptionToggle?: () => void;
}

export default function NewsFeed({ userLat, userLng, radius, onRadiusChange, isSubscribed, onSubscriptionToggle }: NewsFeedProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    const colRef = collection(db, 'requests');
    const unsubscribe = onSnapshot(colRef, (snapshot: any) => {
      const rawItems: NewsItem[] = [];
      
      const processDocs = (docData: any, docId: string) => {
        if (docData.isSpam) return;
        
        const docLat = parseFloat(docData.lat || 0);
        const docLng = parseFloat(docData.lng || 0);
        const uLat = parseFloat(userLat as any || 0);
        const uLng = parseFloat(userLng as any || 0);
        
        if (docLat === 0 && docLng === 0) return;

        let dist = 0;
        try {
          dist = geofire.distanceBetween([docLat, docLng], [uLat, uLng]);
        } catch (e) { dist = 999; }
        
        if (dist <= radius) {
          const riskLevel = docData.riskLevel || 'LOW';
          rawItems.push({
            id: docId,
            title: docData.title,
            category: docData.category || (riskLevel === 'HIGH' ? 'CRITICAL' : riskLevel === 'MEDIUM' ? 'IMPORTANT' : 'GENERAL'),
            riskLevel,
            text: docData.summary || docData.text || 'Ongoing event...',
            summary: docData.summary || docData.text,
            full_report: docData.full_report,
            lat: docLat,
            lng: docLng,
            timestamp: docData.createdAt?.toDate ? docData.createdAt.toDate() : new Date(docData.createdAt || Date.now()),
            isSpam: !!docData.isSpam,
            distance: dist,
            status: docData.status || 'LIVE',
            severity_score: docData.severity_score || (riskLevel === 'HIGH' ? 8 : riskLevel === 'MEDIUM' ? 5 : 2),
            images: docData.images,
            cluster_id: docData.cluster_id,
            is_breaking: !!docData.is_breaking
          });
        }
      };

      if (snapshot.forEach) {
        snapshot.forEach((doc: any) => {
          const data = typeof doc.data === 'function' ? doc.data() : doc;
          processDocs(data, doc.id || data.id);
        });
      }
      
      // ─── CLUSTERING ─────────────────────────────────────────────────
      const map = new Map<string, NewsItem>();
      rawItems.forEach(item => {
        const key = item.cluster_id || item.id;
        if (map.has(key)) {
          const existing = map.get(key)!;
          existing.clusterCount = (existing.clusterCount || 1) + 1;
          if (item.timestamp > existing.timestamp) {
             existing.timestamp = item.timestamp;
             existing.text = item.text;
             existing.status = item.status;
          }
          existing.severity_score = Math.max(existing.severity_score || 0, item.severity_score || 0);
        } else {
          map.set(key, { ...item, clusterCount: 1 });
        }
      });
      
      const clustered = Array.from(map.values());

      // ─── STRICT SORTING RULE ────────────────────────────────────────
      // CRITICAL > IMPORTANT > GENERAL, then Severity, then Recency
      clustered.sort((a, b) => {
        const catOrder = { 'CRITICAL': 0, 'IMPORTANT': 1, 'GENERAL': 2 };
        if (catOrder[a.category] !== catOrder[b.category]) {
          return catOrder[a.category] - catOrder[b.category];
        }
        if ((b.severity_score || 0) !== (a.severity_score || 0)) {
          return (b.severity_score || 0) - (a.severity_score || 0);
        }
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
      
      setNews(clustered.slice(0, 50));
    });

    return () => unsubscribe();
  }, [userLat, userLng, radius]);

  useEffect(() => {
    if (!isHovered && scrollRef.current && !expandedId) {
      const interval = setInterval(() => {
        if (scrollRef.current) scrollRef.current.scrollTop += 1;
      }, 70);
      return () => clearInterval(interval);
    }
  }, [isHovered, expandedId]);

  const getCategoryStyle = (category: string) => {
    switch (category) {
      case 'CRITICAL': return 'border-gray-900 bg-black text-white dark:bg-white dark:text-black';
      case 'IMPORTANT': return 'border-gray-200 bg-gray-50 text-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-white';
      default: return 'border-gray-100 bg-white text-gray-500 dark:border-gray-800 dark:bg-black/20';
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-[#0a0a0a] border-l border-gray-200 dark:border-gray-800 w-full shrink-0">
      <div className="p-5 border-b border-gray-200 dark:border-gray-800 space-y-4">
        <div className="flex items-center justify-between">
           <h2 className="text-xs font-black uppercase tracking-widest text-gray-400">Live Local Feed</h2>
           <button 
             onClick={onSubscriptionToggle}
             className={`text-[9px] px-2.5 py-1 rounded-full font-black uppercase tracking-widest flex items-center gap-1 transition-all ${
               isSubscribed ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/30' : 'bg-gray-100 dark:bg-gray-800 text-gray-400 hover:text-gray-900 dark:hover:text-white'
             }`}
           >
             {isSubscribed ? <Zap className="w-2.5 h-2.5 fill-current" /> : <Lock className="w-2.5 h-2.5" />}
             {isSubscribed ? 'Premium' : 'Go Pro'}
           </button>
        </div>
        
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            <span>Scan Area</span>
            <span className="text-gray-900 dark:text-white">{radius} km</span>
          </div>
          <input 
            type="range" min="5" max="25" step="1" value={radius}
            onChange={(e) => onRadiusChange(Number(e.target.value))}
            className="w-full h-1 bg-gray-200 dark:bg-gray-800 rounded-lg appearance-none cursor-pointer accent-gray-900 dark:accent-white" 
          />
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {news.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-30 select-none">
            <Clock className="w-8 h-8 mb-4 animate-spin-slow" />
            <p className="text-[10px] uppercase font-black tracking-[0.2em]">Synchronizing Signals...</p>
          </div>
        ) : (
          news.map((item) => {
             const isExpanded = expandedId === item.id;
             const isCritical = item.category === 'CRITICAL';

             return (
              <div 
                key={item.id} 
                onClick={() => setExpandedId(isExpanded ? null : item.id)}
                className={`group relative p-4 border rounded-2xl transition-all duration-300 transform ${
                  isExpanded ? 'ring-1 ring-gray-900 dark:ring-white scale-[1.02] z-10 shadow-2xl' : 'hover:border-gray-400 dark:hover:border-white/20'
                } ${getCategoryStyle(item.category)}`}
              >
                {item.is_breaking && (
                  <div className="absolute -top-2 left-4 px-2 py-0.5 bg-red-600 text-white text-[8px] font-black uppercase tracking-widest rounded-sm animate-pulse z-20">
                    Breaking
                  </div>
                )}

                <div className="flex justify-between items-start mb-3">
                  <div className="flex items-center gap-2 font-black text-[9px] uppercase tracking-wider opacity-60">
                    {item.category === 'CRITICAL' ? <ShieldAlert className="w-3.5 h-3.5" /> : 
                     item.category === 'IMPORTANT' ? <Info className="w-3.5 h-3.5" /> : <Bell className="w-3.5 h-3.5" />}
                    {item.category}
                  </div>
                  <div className="flex items-center gap-1.5 font-bold text-[9px] opacity-40 uppercase tracking-tighter">
                    <MapPin className="w-2.5 h-2.5" /> {item.distance_km?.toFixed(1) || item.distance?.toFixed(1)}km
                  </div>
                </div>
                
                <h3 className={`text-sm font-black mb-1.5 leading-tight ${isExpanded ? '' : 'line-clamp-2'}`}>
                  {item.title || item.text}
                </h3>
                
                <p className={`text-xs opacity-70 leading-relaxed ${isExpanded ? '' : 'line-clamp-2'}`}>
                  {item.summary || item.text}
                </p>

                {isExpanded && (
                  <div className="mt-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* Image Placeholder Rule */}
                    {(isCritical || item.images) && (
                      <div className="aspect-video relative rounded-xl overflow-hidden bg-gray-200 dark:bg-gray-800 border border-black/5 flex items-center justify-center text-[10px] font-bold text-gray-400 p-4 text-center italic">
                        {item.images?.[0]?.url.includes('dummyimage') ? (
                           <img src={item.images[0].url} alt={item.images[0].caption} className="absolute inset-0 w-full h-full object-cover mix-blend-overlay opacity-50" />
                        ) : null}
                        <span className="relative z-10">Realistic local news update image description: {item.images?.[0]?.caption || 'Phone camera footage from scene'}</span>
                      </div>
                    )}

                    <div className="text-[10px] leading-relaxed space-y-3">
                       <div className="flex items-center justify-between border-b border-current/10 pb-3">
                         <span className="uppercase opacity-50">Status</span>
                         <span className="font-black flex items-center gap-1.5">
                            <span className={`w-2 h-2 rounded-full ${item.status === 'LIVE' ? 'bg-red-600 animate-pulse' : 'bg-green-600'}`}></span>
                            {item.status}
                         </span>
                       </div>
                       <p className="opacity-80 font-medium">{item.full_report || item.text}</p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2">
                       <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-2 ${
                         isSubscribed ? 'bg-blue-600/10 text-blue-600 border border-blue-600/20' : 'bg-gray-200 dark:bg-white/10 text-gray-500'
                       }`}>
                         {isSubscribed ? <Zap className="w-3 h-3 fill-current" /> : <Lock className="w-3 h-3" />}
                         Advanced Intel
                       </div>
                       {item.clusterCount! > 1 && (
                         <div className="px-3 py-1 bg-gray-900 dark:bg-white text-white dark:text-black rounded-full text-[8px] font-black uppercase tracking-widest">
                           {item.clusterCount} Similar Reports
                         </div>
                       )}
                    </div>
                  </div>
                )}

                {!isExpanded && (
                  <div className="mt-3 flex items-center justify-between text-[8px] font-bold uppercase tracking-widest opacity-30 pt-3 border-t border-current/5">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.timestamp.toLocaleTimeString()}</span>
                    <span>Sev: {item.severity_score}/10</span>
                  </div>
                )}
              </div>
             );
          })
        )}
      </div>
    </div>
  );
}
