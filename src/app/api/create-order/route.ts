import { NextResponse } from 'next/server';
import { getRazorpay } from '@/lib/razorpay';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, amount } = body;

    // Validate inputs
    if (!userId || !amount) {
      return NextResponse.json({ error: 'Missing userId or amount' }, { status: 400 });
    }

    // Razorpay amount is in paise (₹1 = 100 paise)
    const convertedAmount = Math.round(amount * 100);

    const { instance, mode } = getRazorpayConfig();
    const isSimulation = mode === 'SIMULATION';
    
    let orderId = '';
    if (isSimulation) {
      console.log('--- Order API: SIMULATION MODE Active ---');
      orderId = `sim_order_${Date.now()}`;
    } else if (instance) {
      // 1. Create a Razorpay Order
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

    // 2. Initialise the payment record in Firestore as 'created'
    const paymentRef = db.collection('payments').doc();
    await paymentRef.set({
      id: paymentRef.id,
      userId,
      amount, // Store in Rupees
      status: 'created', // Pending payment completion
      razorpayOrderId: orderId,
      createdAt: new Date().toISOString(),
      usedForRequest: false, 
      isSimulation,
    });

    // 3. Return response
    return NextResponse.json({
      success: true,
      orderId: orderId,
      paymentDocId: paymentRef.id,
      amount: convertedAmount,
      currency: 'INR'
    }, { status: 200 });

  } catch (error: any) {
    console.error('Error creating order:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
