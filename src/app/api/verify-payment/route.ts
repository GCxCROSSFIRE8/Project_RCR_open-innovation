import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const isSimulation = body.isSimulation === true;
    const db = getAdminDb(isSimulation);
    const { 
      razorpay_order_id, 
      razorpay_payment_id, 
      razorpay_signature,
      paymentDocId 
    } = body;

    const { mode } = getRazorpayConfig();
    const isSimulation = mode === 'SIMULATION';
    const db = getAdminDb(isSimulation);

    // ... (input validation logic here)

    // Special Bypass for Simulation Mode
    if (isSimulation) {
      console.log('--- Verify API: SIMULATION MODE Bypassing Signature ---');
    } else {
      const secret = process.env.RAZORPAY_KEY_SECRET;
      if (!secret) throw new Error('Razorpay Secret Missing');

      const shasum = crypto.createHmac('sha256', secret);
      shasum.update(`${razorpay_order_id}|${razorpay_payment_id}`);
      const digest = shasum.digest('hex');

      if (digest !== razorpay_signature) {
        throw new Error('Invalid signature');
      }
    }

    // 2. Fetch and Update the corresponding payment record
    const paymentRef = db.collection('payments').doc(paymentDocId);
    
    await paymentRef.update({
      status: isSimulation ? 'simulated_paid' : 'paid',
      razorpayPaymentId: razorpay_payment_id,
      verifiedAt: new Date().toISOString(),
    });

    // 4. Return success to the frontend, authorizing it to proceed to create-request
    return NextResponse.json({ 
      success: true, 
      message: 'Payment verified successfully',
      paymentDocId 
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error verifying payment:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
