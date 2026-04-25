'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, XCircle, CheckCircle, Wallet, Loader2, Bot } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface CrisisRequest {
  id: string;
  text: string;
  riskLevel: string;
  category: string;
  summary: string;
  lat: number;
  lng: number;
  bounty?: number;
  agentStatus?: string;
  priorityScore?: number;
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
      setRequests(prev => prev.filter(r => r.id !== requestId));
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setProcessingId(null);
    }
  };

  const riskLabel = (risk: string) => {
    if (risk === 'HIGH') return 'font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20';
    if (risk === 'MEDIUM') return 'font-bold text-gray-900 dark:text-white bg-gray-200 dark:bg-gray-800';
    return 'font-medium text-gray-500 bg-gray-100 dark:bg-gray-900/50';
  };

  return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0a] text-gray-900 dark:text-white">
      {/* Header */}
      <div className="border-b border-gray-200 dark:border-gray-800 px-6 md:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center font-bold">
            {profile.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-lg font-bold flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-gray-400" /> Validator
            </h1>
            <p className="text-gray-500 text-xs">Last update: {lastUpdate.toLocaleTimeString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg">
          <Wallet className="w-4 h-4 text-gray-500" />
          <span className="font-bold">₹{balance}</span>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 md:p-8 space-y-6">
        {/* Agent Status */}
        <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl px-5 py-3 flex items-center gap-3 text-sm">
          <Bot className="w-4 h-4 text-gray-400" />
          <p className="text-gray-500">AI Agent routes triaged crises here for human verification.</p>
          <div className="ml-auto flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full" />
            <span className="text-gray-400 text-xs font-medium">Active</span>
          </div>
        </div>

        {/* Requests */}
        <div>
          <h2 className="text-base font-bold text-gray-600 dark:text-gray-400 mb-4">
            Pending <span className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-sm ml-1">{requests.length}</span>
          </h2>

          {requests.length === 0 ? (
            <div className="border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-12 text-center text-gray-400">
              <ShieldCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="font-medium">All clear — no pending requests.</p>
              <p className="text-sm mt-1">Submit a crisis from the Dashboard to see it here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {requests.map(req => (
                <div key={req.id} className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 flex flex-col gap-3 hover-lift">
                  {/* Risk + Bounty */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2.5 py-1 rounded-lg bg-gray-200 dark:bg-gray-800 uppercase tracking-wide ${riskLabel(req.riskLevel)}`}>
                      {req.riskLevel} risk
                    </span>
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-lg">
                      ₹{req.bounty || 10} reward
                    </span>
                  </div>

                  {/* Text */}
                  <p className="text-sm leading-relaxed">{req.text}</p>

                  {/* AI Context */}
                  <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium mb-1 flex items-center gap-1">
                      <Bot className="w-3 h-3" /> Agent Summary
                    </p>
                    <p className="text-gray-500 text-xs">{req.summary || 'Processed by agent.'}</p>
                  </div>

                  <p className="text-gray-400 text-[10px]">
                    📍 {req.lat?.toFixed(4)}, {req.lng?.toFixed(4)} · {req.agentStatus || 'PENDING'}
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleValidation(req.id, 'reject')}
                      disabled={processingId !== null}
                      className="flex-1 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 font-medium py-2.5 rounded-lg transition-colors disabled:opacity-40 flex items-center justify-center gap-2 text-sm btn-press"
                    >
                      {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                      Reject
                    </button>
                    <button
                      onClick={() => handleValidation(req.id, 'confirm')}
                      disabled={processingId !== null}
                      className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-medium py-2.5 rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2 text-sm btn-press"
                    >
                      {processingId === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                      Confirm
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
