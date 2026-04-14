import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import * as geofire from 'geofire-common';
import { analyzeCrisisRequest } from '@/lib/gemini';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // In this route, the payment record would already have `isSimulation: true`
    // but for the sake of the getter, we allow a bypass based on development mode
    const db = getAdminDb(true); 
    const { 
      userId, 
      text, 
      lat, 
      lng, 
      paymentDocId 
    } = body;

    // Validate inputs
    if (!userId || !text || lat === undefined || lng === undefined || !paymentDocId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 1. AI Analysis
    const aiAnalysis = await analyzeCrisisRequest(text);

    // Temporary local bypass disabled (Razorpay integrated)

    // 2. Check payment authenticity before creating request
    const paymentRef = db.collection('payments').doc(paymentDocId);
    
    // We use a transaction to safely mark payment as used and create the request
    const newRequestData = await db.runTransaction(async (transaction) => {
      const paymentDoc = await transaction.get(paymentRef);

      if (!paymentDoc.exists) {
        throw new Error('Payment record not found');
      }

      const paymentData = paymentDoc.data();

      // Ensure payment is verified (paid or simulated_paid)
      const isPaid = paymentData?.status === 'paid' || paymentData?.status === 'simulated_paid';
      if (!isPaid) {
        throw new Error('Payment is not verified or failed');
      }

      // Check for duplicate request creation using the same payment
      if (paymentData?.usedForRequest) {
        throw new Error('This payment has already been used to create a request');
      }

      // Validate userId matches the payment's userId
      if (paymentData?.userId !== userId) {
        throw new Error('Payment user does not match request user');
      }

      // 2. Create the Request reference
      const requestRef = db.collection('requests').doc();
      
      // Calculate Geohash for distance querying
      const geohash = geofire.geohashForLocation([lat, lng]);

      const payload = {
        id: requestRef.id,
        userId,
        text,
        lat,
        lng,
        geohash, // Added geohash for real-time localized querying
        status: 'pending',
        risk: aiAnalysis.risk,
        aiAdvice: aiAnalysis.advice,
        aiSummary: aiAnalysis.summary,
        paymentId: paymentDocId, // Link the request to the payment
        createdAt: new Date().toISOString(),
      };

      // Create Request
      transaction.set(requestRef, payload);
      
      // Update Payment to prevent duplicate usage
      transaction.update(paymentRef, { 
        usedForRequest: true, 
        requestId: requestRef.id 
      });

      return payload;
    });

    return NextResponse.json({ 
      success: true, 
      request: newRequestData 
    }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating request:', error);
    // Determine status code based on error message thrown inside transaction
    const status = error.message.includes('Payment') ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
