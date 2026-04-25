import { NextResponse } from 'next/server';
import { getRazorpayConfig } from '@/lib/razorpay';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, amount } = body;

    if (!userId || !amount) {
      return NextResponse.json({ error: 'Missing userId or amount' }, { status: 400 });
    }

    const convertedAmount = Math.round(amount * 100);
    const { instance, mode } = getRazorpayConfig();
    const isSimulation = mode === 'SIMULATION';
    const db = getAdminDb(isSimulation);

    let orderId = '';
    if (isSimulation) {
      console.log('--- Order API: SIMULATION MODE Active ---');
      orderId = `sim_order_${Date.now()}`;
    } else if (instance) {
      const options = {
        amount: convertedAmount,
        currency: 'INR',
        receipt: `rcpt_${userId}_${Date.now()}`
      };
      const order = await instance.orders.create(options);
      orderId = order.id;
    } else {
      throw new Error('Payment gateway not available.');
    }

    const paymentRef = db.collection('payments').doc();
    await paymentRef.set({
      id: paymentRef.id,
      userId,
      amount,
      status: 'created',
      razorpayOrderId: orderId,
      createdAt: new Date().toISOString(),
      usedForRequest: false,
      isSimulation,
    });

    return NextResponse.json({
      success: true,
      orderId,
      paymentDocId: paymentRef.id,
      amount: convertedAmount,
      currency: 'INR',
      isSimulation,
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
