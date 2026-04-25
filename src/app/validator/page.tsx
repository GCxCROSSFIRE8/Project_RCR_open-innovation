'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, XCircle, CheckCircle, Wallet, Loader2, Bot, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

interface CrisisRequest {
  id: string;
  text: string;
  risk: string;
  aiSummary: string;
  aiAdvice: string;
  lat: number;
  lng: number;
  bounty?: number;
  agentStatus?: string;
}

export default function ValidatorPanel() {
  const { profile } = useAuth();
  const [requests, setRequests] = useState<CrisisRequest[]>([]);
  const [balance, setBalance] = useState(0);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  if (!profile) return null;

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/list-requests?isSimulation=true');
      const data = await res.json();
      if (data.success) {
        setRequests(data.requests);
        setLastUpdate(new Date());
      }
    } catch (err) {
      console.error('Poll error:', err);
    }
  };

  useEffect(() => {
    fetchRequests();
    // Auto-refresh every 4 seconds — simulates real-time
    const interval = setInterval(fetchRequests, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleValidation = async (requestId: string, responseType: 'confirm' | 'reject') => {
    setProcessingId(requestId);
    try {
      const res = await fetch('/api/validate-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          validatorId: profile.id,
          response: responseType,
          isSimulation: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Validation failed');

      if (responseType === 'confirm') {
        const req = requests.find(r => r.id === requestId);
        setBalance(prev => prev + (req?.bounty || 10));
      }
      // Remove from list
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const riskBadge = (risk: string) => {
    const styles: Record<string, string> = {
      HIGH: 'bg-red-900/60 text-red-300 border border-red-700',
      MEDIUM: 'bg-yellow-900/60 text-yellow-300 border border-yellow-700',
      LOW: 'bg-green-900/60 text-green-300 border border-green-700',
    };
    return styles[risk] || 'bg-gray-800 text-gray-400 border border-gray-700';
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white font-sans">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-900 px-8 py-5 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black text-lg">
            {profile.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-xl font-black flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-500" /> Validator Interface
            </h1>
            <p className="text-gray-500 text-xs">Auto-refreshing · Last: {lastUpdate.toLocaleTimeString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="bg-green-900/40 border border-green-700 px-5 py-2 rounded-full flex items-center gap-2">
            <Wallet className="w-4 h-4 text-green-400" />
            <span className="text-green-300 font-black text-lg">₹{balance}</span>
          </div>
          <Link href="/dashboard" className="text-gray-500 hover:text-white text-sm font-medium transition-colors">← Dashboard</Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto p-8 space-y-6">
        {/* Agent Status Banner */}
        <div className="bg-blue-950/40 border border-blue-800 rounded-2xl px-6 py-4 flex items-center gap-3">
          <Bot className="w-5 h-5 text-blue-400 animate-pulse" />
          <div>
            <p className="text-blue-300 font-bold text-sm">Autonomous AI Agent Active</p>
            <p className="text-blue-500 text-xs">Agent automatically triages all incoming crises, assigns dynamic bounties, and routes tasks here.</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-green-400 text-xs font-bold uppercase tracking-widest">Live</span>
          </div>
        </div>

        {/* Requests */}
        <div>
          <h2 className="text-lg font-bold text-gray-300 mb-4">
            Pending Verifications <span className="bg-gray-800 px-2 py-0.5 rounded-full text-sm ml-1">{requests.length}</span>
          </h2>

          {requests.length === 0 ? (
            <div className="border-2 border-dashed border-gray-800 rounded-3xl p-16 text-center text-gray-600">
              <ShieldCheck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-medium">All clear — no pending requests.</p>
              <p className="text-sm mt-1">Submit a crisis from the Dashboard to see it here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {requests.map(req => (
                <div key={req.id} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 flex flex-col gap-4 hover:border-gray-600 transition-colors">
                  {/* Risk + Bounty */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider ${riskBadge(req.risk)}`}>
                      {req.risk} RISK
                    </span>
                    <div className="flex items-center gap-1 text-yellow-400 font-black text-sm bg-yellow-900/30 px-3 py-1 rounded-full border border-yellow-800">
                      <Zap className="w-3 h-3" /> ₹{req.bounty || 10} Reward
                    </div>
                  </div>

                  {/* Crisis text */}
                  <p className="text-gray-200 text-sm leading-relaxed font-medium">{req.text}</p>

                  {/* AI Context */}
                  <div className="bg-gray-800/60 border border-gray-700 rounded-xl p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1 flex items-center gap-1">
                      <Bot className="w-3 h-3" /> Agent Summary
                    </p>
                    <p className="text-gray-400 text-xs italic">{req.aiSummary || req.aiAdvice}</p>
                  </div>

                  <p className="text-gray-600 text-[10px]">
                    📍 {req.lat?.toFixed(4)}, {req.lng?.toFixed(4)} · Status: {req.agentStatus || 'PENDING'}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => handleValidation(req.id, 'reject')}
                      disabled={processingId !== null}
                      className="flex-1 bg-red-950/40 hover:bg-red-900/60 border border-red-900 text-red-400 font-bold py-3 rounded-xl transition-colors disabled:opacity-40 flex items-center justify-center gap-2 text-sm"
                    >
                      {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Reject
                    </button>
                    <button
                      onClick={() => handleValidation(req.id, 'confirm')}
                      disabled={processingId !== null}
                      className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-40 flex items-center justify-center gap-2 text-sm"
                    >
                      {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Confirm (+₹{req.bounty || 10})
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
