'use client';

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { db, collection, onSnapshot, query } from '@/lib/firebase';
import { AlertCircle, FileWarning, ShieldAlert } from 'lucide-react';
import ReactDOMServer from 'react-dom/server';

interface CrisisRequest {
  id: string;
  lat: number;
  lng: number;
  text: string;
  risk: 'LOW' | 'MEDIUM' | 'HIGH' | 'PENDING';
  status: 'pending' | 'verified' | 'rejected';
  aiSummary: string;
}

// Map risk to styling and create Leaflet DivIcons
const getRiskIcon = (risk: string) => {
  let color = 'text-green-500';
  let IconComponent = FileWarning;

  if (risk === 'HIGH') {
    color = 'text-red-600';
    IconComponent = ShieldAlert;
  } else if (risk === 'MEDIUM') {
    color = 'text-yellow-500';
    IconComponent = AlertCircle;
  }

  const iconHtml = ReactDOMServer.renderToString(
    <div className={`cursor-pointer hover:scale-110 transition-transform ${color}`}>
      <IconComponent size={32} strokeWidth={2.5} className="drop-shadow-lg" />
    </div>
  );

  return L.divIcon({
    html: iconHtml,
    className: 'custom-leaflet-icon',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32]
  });
};

function ChangeView({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  map.setView(center, zoom);
  return null;
}

export default function LeafletMap() {
  const [requests, setRequests] = useState<CrisisRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<CrisisRequest | null>(null);

  const [viewState] = useState({
    latitude: 28.6139, // Default to Delhi for demo
    longitude: 77.2090,
    zoom: 11
  });

  useEffect(() => {
    if (!db) {
      console.warn('LeafletMap: Using Mock Requests for simulation.');
      setRequests([
        { id: 'm1', lat: 28.6139, lng: 77.2090, text: 'Flash flood reported near park', risk: 'HIGH', status: 'pending', aiSummary: 'Immediate evacuation suggested.' },
        { id: 'm2', lat: 28.6339, lng: 77.2190, text: 'Tree fallen on power line', risk: 'MEDIUM', status: 'verified', aiSummary: 'Utility team notified.' }
      ]);
      return;
    }

    // Listen to all requests in real time for the demo
    const q = query(collection(db, 'requests'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data: CrisisRequest[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() } as CrisisRequest);
      });
      setRequests(data);
    }, (err) => {
      console.error('Firestore Error in Map:', err);
    });

    return () => unsubscribe();
  }, []);

  const getRiskStyles = (risk: string) => {
    switch (risk) {
      case 'HIGH': return { color: 'text-red-600' };
      case 'MEDIUM': return { color: 'text-yellow-500' };
      case 'LOW':
      case 'PENDING':
      default: return { color: 'text-green-500' };
    }
  };

  return (
    <div className="w-full h-full relative z-0">
      <MapContainer
        center={[viewState.latitude, viewState.longitude]}
        zoom={viewState.zoom}
        scrollWheelZoom={true}
        className="w-full h-full"
        zoomControl={false} // Clean UI
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        
        {requests.map((req) => (
          <Marker
            key={req.id}
            position={[req.lat, req.lng]}
            icon={getRiskIcon(req.risk)}
            eventHandlers={{
              click: () => setSelectedRequest(req)
            }}
          >
            <Popup className="custom-popup">
              <div className="p-2 w-64">
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-bold px-2 py-1 rounded bg-opacity-20 ${getRiskStyles(req.risk).color} ${getRiskStyles(req.risk).color.replace('text-', 'bg-')}`}>
                    {req.risk} RISK
                  </span>
                  <span className="text-xs text-gray-500 uppercase font-bold">{req.status}</span>
                </div>
                <p className="font-semibold text-gray-800 text-sm mb-1 line-clamp-3">{req.text}</p>
                <p className="text-gray-600 text-xs italic border-t border-gray-100 pt-1 mt-1">{req.aiSummary}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Custom Leaflet Styles for Dark Theme Compatibility */}
      <style jsx global>{`
        .leaflet-container {
          background: #111 !important;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          background: white;
          border-radius: 12px;
          padding: 0;
          overflow: hidden;
        }
        .custom-popup .leaflet-popup-content {
          margin: 0;
          width: auto !important;
        }
        .custom-popup .leaflet-popup-tip {
          background: white;
        }
        .custom-leaflet-icon {
          background: transparent;
          border: none;
        }
      `}</style>
    </div>
  );
}
