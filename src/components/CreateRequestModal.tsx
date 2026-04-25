'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, Compass, Loader2, CreditCard, FlaskConical, CheckCircle2, Bot, Users, Zap } from 'lucide-react';
import Script from 'next/script';
import { useAuth } from '@/context/AuthContext';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLat: number;
  userLng: number;
}

export default function CreateRequestModal({ isOpen, onClose, userLat, userLng }: CreateRequestModalProps) {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSimulation, setIsSimulation] = useState(true);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);
  const [agentStep, setAgentStep] = useState('');

  const { profile } = useAuth();

  useEffect(() => {
    const rzpKey = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    setIsSimulation(!rzpKey || rzpKey === 'mock_rzp_key');
  }, []);

  if (!profile || !isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsLoading(true);
    setError('');
    setAgentStep('Initializing payment...');

    try {
      // Step 1: Create Order
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id, amount: 50 }),
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Failed to create order');

      if (isSimulation) {
        // Simulation Flow
        setAgentStep('Verifying simulated payment...');
        const verifyRes = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: orderData.orderId,
            razorpay_payment_id: 'sim_pay_' + Date.now(),
            razorpay_signature: 'sim_sig',
            paymentDocId: orderData.paymentDocId,
            isSimulation: true,
          }),
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.success) throw new Error(verifyData.error || 'Verification failed');

        setAgentStep('🤖 AI Agent: Triaging crisis risk...');
        await new Promise(r => setTimeout(r, 600));
        setAgentStep('🤖 AI Agent: Calculating dynamic bounty...');
        await new Promise(r => setTimeout(r, 700));
        setAgentStep('🤖 AI Agent: Searching for nearby validators...');
        await new Promise(r => setTimeout(r, 800));
        setAgentStep('🤖 AI Agent: Assigning best validator...');

        await finalizeRequest(orderData.paymentDocId);
      } else {
        // Live Razorpay Flow
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '',
          amount: orderData.amount,
          currency: orderData.currency,
          name: "Localyze Crisis Request",
          description: "AI-Verified Crisis Network",
          order_id: orderData.orderId,
          handler: async (response: any) => {
            setAgentStep('🤖 AI Agent analyzing crisis...');
            await finalizeRequest(orderData.paymentDocId, response);
          },
          prefill: { name: profile.name, email: profile.email },
          theme: { color: "#2563eb" },
        };
        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
      setAgentStep('');
    }
  };

  const finalizeRequest = async (paymentDocId: string, razorpayResponse?: any) => {
    try {
      const requestRes = await fetch('/api/create-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id, text, lat: userLat, lng: userLng, paymentDocId }),
      });
      const requestData = await requestRes.json();
      if (!requestRes.ok) throw new Error(requestData.error || 'Failed to submit request');
      setResult(requestData.request);
      setAgentStep('');
    } catch (err: any) {
      setError(err.message);
      setAgentStep('');
    } finally {
      setIsLoading(false);
    }
  };

  const getRiskStyle = (risk: string) => {
    switch (risk) {
      case 'HIGH':   return 'border-blue-600/30 bg-blue-50/50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400';
      case 'MEDIUM': return 'border-gray-400 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white';
      default:       return 'border-gray-200 bg-gray-50/50 dark:bg-gray-900/50 text-gray-500';
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
        <div className="bg-gray-900 border border-gray-700 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden">

          {/* Header */}
          <div className="bg-gray-950 px-8 py-6 border-b border-gray-800 flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-black text-white flex items-center gap-3">
                <ShieldAlert className="w-6 h-6 text-red-500" /> Report Crisis
              </h2>
              <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest">Autonomous AI · Community Verified</p>
            </div>
            <button onClick={onClose} disabled={isLoading} className="text-gray-600 hover:text-white transition-colors disabled:opacity-30 text-2xl font-light">✕</button>
          </div>

          <div className="p-8">
            {!result ? (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Describe the Emergency</label>
                  <textarea
                    className="w-full bg-gray-800 border border-gray-700 rounded-2xl p-4 text-white font-medium focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-base min-h-[130px] placeholder-gray-600"
                    placeholder="Provide clear details — location, people involved, type of emergency..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="flex items-center gap-3 text-xs text-gray-500 bg-gray-800/50 border border-gray-700 p-3 rounded-xl">
                  <Compass className="w-4 h-4 text-blue-500 shrink-0" />
                  <span>Location: {userLat.toFixed(4)}, {userLng.toFixed(4)}</span>
                </div>

                {/* Agent Steps Display */}
                {agentStep && (
                  <div className="flex items-center gap-3 bg-blue-950/50 border border-blue-800 p-4 rounded-2xl text-blue-300 text-sm font-medium">
                    <Bot className="w-5 h-5 shrink-0 animate-pulse" />
                    <span>{agentStep}</span>
                    <Loader2 className="w-4 h-4 animate-spin ml-auto shrink-0" />
                  </div>
                )}

                {error && (
                  <div className="bg-red-950/50 border border-red-800 p-4 rounded-2xl text-red-400 text-sm font-medium">
                    ⚠ {error}
                  </div>
                )}

                {/* AI Features Preview */}
                {!isLoading && (
                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    {[
                      { icon: Bot, label: "AI Triage" },
                      { icon: Zap, label: "Dynamic Bounty" },
                      { icon: Users, label: "Auto-Match" },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="bg-gray-800 border border-gray-700 rounded-xl p-3 text-gray-400">
                        <Icon className="w-4 h-4 mx-auto mb-1 text-blue-500" />
                        {label}
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isLoading || !text.trim()}
                  className={`w-full text-white font-black py-4 rounded-2xl transition-all disabled:opacity-40 flex items-center justify-center gap-3 uppercase tracking-widest text-sm ${
                    isSimulation ? 'bg-orange-600 hover:bg-orange-500' : 'bg-blue-600 hover:bg-blue-500'
                  }`}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      {isSimulation ? <FlaskConical className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                      {isSimulation ? 'Run AI Simulation (Free)' : 'Pay ₹50 & Activate Agent'}
                    </>
                  )}
                </button>
                {isSimulation && <p className="text-center text-gray-600 text-[11px] uppercase tracking-widest">Sandbox mode — no real payment required</p>}
              </form>
            ) : (
              <div className="space-y-6">
                {/* Success Header */}
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-900/50 border border-green-700 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-2xl font-black text-white">Request Live!</h3>
                  <p className="text-gray-500 text-xs mt-1 uppercase tracking-widest">Agent processing complete</p>
                </div>

                {/* Agent Results Card */}
                <div className={`border rounded-2xl p-5 space-y-4 ${getRiskStyle(result.riskLevel)}`}>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold uppercase tracking-widest opacity-70 flex items-center gap-2">
                      <Bot className="w-3 h-3" /> Agent Assessment
                    </span>
                    <span className="font-black text-xs px-3 py-1 bg-black/30 rounded-full">{result.riskLevel} RISK</span>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-black/20 rounded-xl p-3">
                      <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Dynamic Bounty</p>
                      <p className="text-2xl font-black">₹{result.bounty || 50}</p>
                    </div>
                    <div className="bg-black/20 rounded-xl p-3">
                      <p className="text-[10px] uppercase tracking-widest opacity-60 mb-1">Agent Status</p>
                      <p className="text-sm font-bold">{result.agentStatus || 'COMPLETED'}</p>
                    </div>
                  </div>

                  <div className="bg-black/20 rounded-xl p-3">
                    <p className="text-[10px] uppercase tracking-widest opacity-60 mb-2">AI Summary</p>
                    <p className="text-sm leading-relaxed">{result.summary || 'Crisis processed by autonomous agent.'}</p>
                  </div>
                </div>

                <button
                  onClick={onClose}
                  className="w-full bg-white text-gray-900 font-black py-4 rounded-2xl hover:bg-gray-100 transition-all uppercase tracking-widest text-sm"
                >
                  Back to Network Map
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
