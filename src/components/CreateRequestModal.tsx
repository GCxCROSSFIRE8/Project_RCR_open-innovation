'use client';

import { useState, useEffect } from 'react';
import { ShieldAlert, Compass, Loader2, CreditCard, FlaskConical, CheckCircle2 } from 'lucide-react';
import Script from 'next/script';
import { useAuth } from '@/context/AuthContext';
import { increment } from 'firebase/firestore';
import { db, doc, updateDoc } from '@/lib/firebase';

interface CreateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  userLat: number;
  userLng: number;
}

export default function CreateRequestModal({ isOpen, onClose, userLat, userLng }: CreateRequestModalProps) {
  const [text, setText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPaymentProcessing, setIsPaymentProcessing] = useState(false);
  const [isSimulation, setIsSimulation] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState<any>(null);

  const { profile } = useAuth();

  useEffect(() => {
    // Automatically determine mode from public env
    setIsSimulation(!process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID);
  }, []);

  if (!profile || !isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    setIsLoading(true);
    setIsPaymentProcessing(true);
    setError('');
    
    try {
      // 1. Create Order
      const orderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: profile.id, amount: 50 }) 
      });

      const orderData = await orderRes.json();
      if (!orderRes.ok) throw new Error(orderData.error || 'Failed to initialize payment');

      if (isSimulation) {
        // --- SIMULATION FLOW ---
        const verifyRes = await fetch('/api/verify-payment', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            razorpay_order_id: orderData.orderId,
            razorpay_payment_id: 'sim_payment_' + Date.now(),
            razorpay_signature: 'sim_signature',
            paymentDocId: orderData.paymentDocId,
            isSimulation: true
          })
        });

        const verifyData = await verifyRes.json();
        if (!verifyData.success) throw new Error(verifyData.error || 'Simulation verification failed');

        await finalizeRequest(orderData.paymentDocId);

      } else {
        // --- LIVE RAZORPAY FLOW ---
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '', 
          amount: orderData.amount,
          currency: orderData.currency,
          name: "Localyze Crisis Request",
          description: "Post a verified paid crisis request",
          order_id: orderData.orderId,
          handler: async function (response: any) {
             await finalizeRequest(orderData.paymentDocId, response);
          },
          prefill: { name: profile.name, email: profile.email },
          theme: { color: "#2563eb" }
        };

        const razorpay = new (window as any).Razorpay(options);
        razorpay.open();
        setIsLoading(false);
      }
    } catch (err: any) {
      setError(err.message);
      setIsPaymentProcessing(false);
      setIsLoading(false);
    }
  };

  const finalizeRequest = async (paymentDocId: string, razorpayResponse?: any) => {
    try {
      setIsPaymentProcessing(true);
      
      // Create the actual request
      const requestRes = await fetch('/api/create-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: profile.id,
          text,
          lat: userLat,
          lng: userLng,
          paymentDocId
        })
      });

      const requestData = await requestRes.json();
      if (!requestRes.ok) throw new Error(requestData.error || 'Failed to submit request');

      // Update User Stats
      const userRef = doc(db, 'users', profile.id);
      await updateDoc(userRef, {
        totalRequests: increment(1),
        trustScore: increment(2)
      });

      setResult(requestData.request);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsPaymentProcessing(false);
      setIsLoading(false);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'HIGH': return 'text-red-700 bg-red-50 border-red-200';
      case 'MEDIUM': return 'text-yellow-700 bg-yellow-50 border-yellow-200';
      case 'LOW': return 'text-green-700 bg-green-50 border-green-200';
      default: return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" />
      
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
          
          {/* Header */}
          <div className="bg-gray-900 p-8 text-white flex justify-between items-start">
            <div>
              <h2 className="text-3xl font-black flex items-center gap-3 tracking-tighter">
                <ShieldAlert className="w-8 h-8 text-red-500" />
                Report Crisis
              </h2>
              <p className="text-gray-400 text-sm font-medium mt-1 uppercase tracking-widest">AI & Community Verification</p>
            </div>
            <button 
              onClick={onClose} 
              disabled={isPaymentProcessing} 
              className="text-gray-500 hover:text-white transition-colors p-2 -mr-2 disabled:opacity-30"
            >
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="p-8">
            {!result ? (
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Describe the Emergency</label>
                  <textarea
                    className="w-full bg-gray-50 border-2 border-gray-100 rounded-2xl p-5 text-gray-900 font-medium focus:ring-4 focus:ring-blue-100 focus:border-blue-500 outline-none transition-all text-lg min-h-[140px]"
                    placeholder="Provide clear details including landmarks..."
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    disabled={isLoading || isPaymentProcessing}
                    required
                  />
                </div>

                <div className="flex items-center gap-3 text-xs font-bold text-gray-500 bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Compass className="w-4 h-4 text-blue-600" />
                  </div>
                  <span>Location Locked: {userLat.toFixed(4)}, {userLng.toFixed(4)}</span>
                </div>

                {error && (
                  <div className="bg-red-50 border-2 border-red-100 p-4 rounded-2xl flex items-start gap-3 text-red-600">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <p className="text-sm font-bold">{error}</p>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isLoading || isPaymentProcessing || !text.trim()}
                  className={`w-full text-white font-black py-5 rounded-2xl transition-all disabled:opacity-50 flex items-center justify-center gap-3 shadow-2xl uppercase tracking-widest ${
                    isSimulation ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-900/20' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-900/20'
                  }`}
                >
                  {isPaymentProcessing ? (
                     <Loader2 className="w-6 h-6 animate-spin" />
                  ) : (
                    <>
                      {isSimulation ? <FlaskConical className="w-5 h-5" /> : <CreditCard className="w-5 h-5" />}
                      {isSimulation ? 'Start Simulation' : 'Pay ₹50 to Post'}
                    </>
                  )}
                </button>

                {isSimulation && (
                  <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-[0.2em]">
                    Running in sandbox. No real payment required.
                  </p>
                )}
              </form>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
                <div className="text-center">
                  <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <CheckCircle2 className="w-12 h-12 text-green-500" />
                  </div>
                  <h3 className="text-4xl font-black text-gray-900 tracking-tighter">Request Live.</h3>
                  <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-2">AI verification complete</p>
                </div>

                <div className={`p-8 rounded-[32px] border-2 shadow-xl ${getRiskColor(result.risk)}`}>
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="font-black uppercase text-[10px] tracking-[0.2em] opacity-60">System Assessment</h4>
                    <span className="font-black text-xs tracking-widest px-4 py-1.5 bg-white rounded-full shadow-sm text-gray-900">{result.risk} RISK</span>
                  </div>
                  <p className="text-xl font-black mb-6 leading-tight tracking-tight">"{result.aiSummary}"</p>
                  <div className="bg-white/60 backdrop-blur-sm p-5 rounded-2xl border border-black/5">
                    <span className="font-black block mb-2 text-[10px] uppercase tracking-widest opacity-50">Protocol Advice:</span>
                    <p className="font-bold text-gray-900">{result.aiAdvice}</p>
                  </div>
                </div>

                <button 
                  onClick={onClose}
                  className="w-full bg-gray-900 hover:bg-black text-white font-black py-5 rounded-2xl transition-all shadow-xl shadow-black/10 uppercase tracking-widest"
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
