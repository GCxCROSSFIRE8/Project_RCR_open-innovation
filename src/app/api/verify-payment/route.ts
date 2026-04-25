import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      paymentDocId,
      isSimulation,
    } = body;

    if (!paymentDocId) {
      return NextResponse.json({ error: 'Missing paymentDocId' }, { status: 400 });
    }

    const db = getAdminDb(isSimulation);

    if (!isSimulation) {
      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (!secret) throw new Error('Razorpay Secret Missing');
      const shasum = crypto.createHmac('sha256', secret);
      shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const digest = shasum.digest('hex');
      if (digest !== razorpay_signature) {
        throw new Error('Invalid payment signature');
      }
    } else {
      console.log('--- Verify API: SIMULATION MODE — Bypassing Signature Check ---');
    }

    const paymentRef = db.collection('payments').doc(paymentDocId);
    await paymentRef.update({
      status: isSimulation ? 'simulated_paid' : 'paid',
      razorpayPaymentId: razorpay_payment_id || 'sim_payment',
      verifiedAt: new Date().toISOString(),
    });

    return NextResponse.json({ success: true, paymentDocId }, { status: 200 });

  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
