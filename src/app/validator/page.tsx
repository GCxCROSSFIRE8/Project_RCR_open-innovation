'use client';

import { useEffect, useState } from 'react';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { ShieldCheck, XCircle, CheckCircle, Wallet, Loader2 } from 'lucide-react';

interface CrisisRequest {
  id: string;
  text: string;
  risk: string;
  aiSummary: string;
  aiAdvice: string;
  lat: number;
  lng: number;
}

import { useAuth } from '@/context/AuthContext';

export default function ValidatorPanel() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<CrisisRequest[]>([]);
  const [balance, setBalance] = useState(0);
  const [processingId, setProcessingId] = useState<string | null>(null);

  if (!profile) return null;
  const VALIDATOR_ID = profile.id;

  useEffect(() => {
    // 1. Unified Request Fetching (Supports real DB and Simulation Fallback)
    const fetchRequests = async () => {
      try {
        const res = await fetch('/api/list-requests?isSimulation=true');
        const data = await res.json();
        if (data.success) {
          setRequests(data.requests);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    // 1. Real-time Firebase Listener (Attempts to connect)
    let unsubscribeRequests = () => {};
    if (db) {
      try {
        const q = query(collection(db, 'requests'), where('status', '==', 'pending'));
        unsubscribeRequests = onSnapshot(q, (snapshot) => {
          const data: CrisisRequest[] = [];
          snapshot.forEach((doc) => {
            data.push({ id: doc.id, ...doc.data() } as CrisisRequest);
          });
          setRequests(data);
        }, (err) => {
          console.warn('Firebase Listener failed, using Polling Fallback:', err.message);
          fetchRequests(); // Initial fetch
        });
      } catch (e) {
        console.warn('Firebase query failed, using Polling Fallback');
        fetchRequests();
      }
    } else {
      console.warn('ValidatorPanel: Firestore DB missing, using Polling Fallback.');
      fetchRequests();
    }

    // 2. Poll every 5 seconds for simulation mode robustness
    const interval = setInterval(fetchRequests, 5000);

    // 3. Listen for Validator Earnings Live
    let unsubscribeUser = () => {};
    try {
      const userRef = doc(db, 'users', VALIDATOR_ID);
      unsubscribeUser = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists() && docSnap.data().balance !== undefined) {
          setBalance(docSnap.data().balance);
        } else if (docSnap.exists() && docSnap.data().earnings !== undefined) {
          setBalance(docSnap.data().earnings);
        }
      });
    } catch (e) {}

    return () => {
      unsubscribeRequests();
      unsubscribeUser();
      clearInterval(interval);
    };
  }, []);

  const handleValidation = async (requestId: string, responseType: 'confirm' | 'reject') => {
    setProcessingId(requestId);
    
    // 1. Get Validator Current Location for Verification
    const getLocationAndVerify = () => {
      return new Promise<{ lat: number; lng: number } | null>((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(null),
          { timeout: 5000 }
        );
      });
    };

    try {
      const coords = await getLocationAndVerify();
      
      const res = await fetch('/api/validate-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          validatorId: VALIDATOR_ID,
          response: responseType,
          lat: coords?.lat,
          lng: coords?.lng
        })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to validate request');
      
    } catch (err: any) {
      alert(`Trust Verification Error: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 font-sans p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-8">
        
        {/* Header & Dashboard */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-gray-900 flex items-center gap-3">
              <ShieldCheck className="w-8 h-8 text-blue-600" />
              Validator Interface
            </h1>
            <p className="text-gray-500 mt-1">Review pending requests nearby. Earn ₹10 per confirmation.</p>
          </div>
          
          <div className="flex items-center gap-4 bg-gradient-to-tr from-green-50 to-green-100 px-6 py-4 rounded-2xl border border-green-200">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-green-600 shadow-sm">
              <Wallet className="w-6 h-6" />
            </div>
            <div>
              <p className="text-green-800 text-sm font-semibold uppercase tracking-wider">Earnings</p>
              <p className="text-3xl font-black text-green-700">₹{balance}</p>
            </div>
          </div>
        </div>

        {/* Requests Feed */}
        <div>
          <h2 className="text-xl font-bold mb-4">Pending Verifications ({requests.length})</h2>
          
          {requests.length === 0 ? (
             <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center text-gray-500">
               <ShieldCheck className="w-12 h-12 text-gray-300 mx-auto mb-3" />
               <p className="text-lg font-medium">All caught up!</p>
               <p className="text-sm">There are no pending requests around your location.</p>
             </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {requests.map(req => (
                <div key={req.id} className="bg-white rounded-3xl p-6 shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-lg transition-shadow">
                  
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wider ${
                        req.risk === 'HIGH' ? 'bg-red-100 text-red-700' :
                        req.risk === 'MEDIUM' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {req.risk} RISK
                      </span>
                      <span className="text-xs text-gray-400">Lat: {req.lat.toFixed(3)} | Lng: {req.lng.toFixed(3)}</span>
                    </div>

                    <p className="text-lg font-medium text-gray-900 mb-2 leading-relaxed">{req.text}</p>
                    
                    <div className="bg-gray-50 rounded-2xl p-4 mt-4 border border-gray-100">
                      <p className="text-sm font-semibold text-gray-700 mb-1">AI Context</p>
                      <p className="text-xs text-gray-600 italic">"{req.aiSummary}"</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 w-full">
                    <button 
                      onClick={() => handleValidation(req.id, 'reject')}
                      disabled={processingId !== null}
                      className="flex-1 min-w-0 bg-red-50 hover:bg-red-100 text-red-700 font-bold py-4 rounded-2xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {processingId === req.id ? <Loader2 className="w-5 h-5 animate-spin" /> : <XCircle className="w-5 h-5" />}
                      Reject
                    </button>
                    <button 
                      onClick={() => handleValidation(req.id, 'confirm')}
                      disabled={processingId !== null}
                      className="flex-1 min-w-0 bg-gray-900 hover:bg-black text-white font-bold py-4 rounded-2xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-gray-300"
                    >
                      {processingId === req.id ? <Loader2 className="w-5 h-5 animate-spin text-white" /> : <CheckCircle className="w-5 h-5" />}
                      Verify (+₹10)
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
