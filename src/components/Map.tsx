'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Dynamically import the Leaflet Map with no SSR
// This is required because Leaflet references 'window' which is not available on the server.
const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900 text-white gap-4">
      <Loader2 className="w-12 h-12 animate-spin text-blue-500" />
      <p className="text-gray-400 font-medium animate-pulse">Initializing Map...</p>
    </div>
  )
});

export default function Map() {
  return <LeafletMap />;
}
