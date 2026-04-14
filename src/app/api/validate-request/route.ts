import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const db = getAdminDb(true); // Allow simulation fallback in dev
    const body = await req.json();
    const { requestId, validatorId, response, lat: validatorLat, lng: validatorLng } = body;

    if (!requestId || !validatorId || !response) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Helper: Haversine distance in meters
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371e3; // metres
      const φ1 = lat1 * Math.PI/180;
      const φ2 = lat2 * Math.PI/180;
      const Δφ = (lat2-lat1) * Math.PI/180;
      const Δλ = (lon2-lon1) * Math.PI/180;
      const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      return R * c;
    };

    if (response !== 'confirm' && response !== 'reject') {
      return NextResponse.json({ error: 'Invalid response. Must be confirm or reject.' }, { status: 400 });
    }

    const TOTAL_PAID = 50;
    const REWARD_AMOUNT = 10; // Reward per validation ₹10
    const COMMISSION_AMOUNT = TOTAL_PAID - REWARD_AMOUNT; // Platform cut ₹40

    // Using a transaction to ensure we don't reward multiple users for the same request
    const transactionResult = await db.runTransaction(async (transaction) => {
      const requestRef = db.collection('requests').doc(requestId);
      const validatorRef = db.collection('users').doc(validatorId);

      const requestDoc = await transaction.get(requestRef);
      if (!requestDoc.exists) {
        throw new Error('Request not found');
      }

      const requestData = requestDoc.data();

      // 1. LOCATION VERIFICATION (Trust System)
      // We enforce that the validator must be within 500 meters of the crisis
      if (validatorLat !== undefined && validatorLng !== undefined) {
         const distance = calculateDistance(validatorLat, validatorLng, requestData?.lat, requestData?.lng);
         if (distance > 500) {
            throw new Error(`Location Verification Failed: You are ${Math.round(distance)}m away. You must be within 500m to verify.`);
         }
      } else if (process.env.NODE_ENV === 'production') {
         // In production, we strictly require coordinates
         throw new Error('Location coordinates are required for physical verification.');
      }

      // 2. Ensure no duplicate validations mapping to the same request
      if (requestData?.status !== 'pending') {
        throw new Error('Request has already been validated');
      }

      // Check if the validator exists
      const validatorDoc = await transaction.get(validatorRef);
      // We don't throw if false just for testing ease but in prod we might enforce user existence
      const currentBalance = validatorDoc.exists ? (validatorDoc.data()?.balance || 0) : 0;

      // 2. Update Request Status
      const newStatus = response === 'confirm' ? 'verified' : 'rejected';
      transaction.update(requestRef, { status: newStatus });

      // 3. Create a Validation Audit Record
      const validationRef = db.collection('validations').doc();
      transaction.set(validationRef, {
         id: validationRef.id,
         requestId,
         validatorId,
         response,
         timestamp: new Date().toISOString()
      });

      // 4. Handle Earnings & Trust
      if (response === 'confirm') {
         const earningRef = db.collection('earnings').doc();
          transaction.set(earningRef, {
             id: earningRef.id,
             validatorId,
             requestId,
             payoutAmount: REWARD_AMOUNT,
             platformCommission: COMMISSION_AMOUNT,
             totalTransaction: TOTAL_PAID,
             status: 'pending' // pending until withdrawn
          });

         // Update validator: +₹10 earnings, +10 Trust Score, +1 validation
         if (validatorDoc.exists) {
            const currentEarnings = validatorDoc.data()?.earnings || 0;
            const currentTrust = validatorDoc.data()?.trustScore || 50;
            const currentTotalVal = validatorDoc.data()?.totalValidations || 0;

            transaction.update(validatorRef, {
              earnings: currentEarnings + REWARD_AMOUNT,
              trustScore: currentTrust + 10,
              totalValidations: currentTotalVal + 1
            });
         }
      } else if (response === 'reject') {
         // Validator rejected the request (System check: Wrong validation?)
         // For now, if a validator rejects a pending request, we assume they are doing their job.
         // If we had a consensus mechanism, we'd penalize the minority.
         // For this stage: Rejecting a request still counts as +1 validation activity.
         if (validatorDoc.exists) {
            transaction.update(validatorRef, {
              totalValidations: (validatorDoc.data()?.totalValidations || 0) + 1
            });
         }
      }

      return { newStatus, reward: response === 'confirm' ? REWARD_AMOUNT : 0 };
    });

    return NextResponse.json({ 
      success: true, 
      message: `Request successfully ${transactionResult.newStatus}.`,
      rewardEarned: transactionResult.reward
    }, { status: 200 });

  } catch (error: any) {
    console.error('Validation Error:', error);
    // Return 409 Conflict if they're trying to validate an already validated request
    const status = error.message.includes('already been validated') ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
