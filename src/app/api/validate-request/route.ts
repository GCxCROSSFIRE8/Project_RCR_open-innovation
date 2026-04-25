import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { requestId, validatorId, response, lat: validatorLat, lng: validatorLng, isSimulation } = body;

    if (!requestId || !validatorId || !response) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const db = getAdminDb(isSimulation ?? true);

    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
      const R = 6371e3;
      const φ1 = lat1 * Math.PI / 180;
      const φ2 = lat2 * Math.PI / 180;
      const Δφ = (lat2 - lat1) * Math.PI / 180;
      const Δλ = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    if (response !== 'confirm' && response !== 'reject') {
      return NextResponse.json({ error: 'Invalid response.' }, { status: 400 });
    }

    const transactionResult = await db.runTransaction(async (transaction: any) => {
      const requestRef = db.collection('requests').doc(requestId);
      const validatorRef = db.collection('users').doc(validatorId);

      const requestDoc = await transaction.get(requestRef);
      if (!requestDoc.exists) throw new Error('Request not found');

      const requestData = requestDoc.data();
      if (requestData?.status !== 'pending') throw new Error('Request has already been validated');

      // Location check (skip in simulation)
      if (!isSimulation && validatorLat !== undefined && validatorLng !== undefined) {
        const distance = calculateDistance(validatorLat, validatorLng, requestData?.lat, requestData?.lng);
        if (distance > 500) {
          throw new Error(`Location Verification Failed: You are ${Math.round(distance)}m away. Must be within 500m.`);
        }
      }

      // Use agent-assigned dynamic bounty, fall back to ₹10
      const REWARD_AMOUNT = requestData?.bounty || 10;

      const validatorDoc = await transaction.get(validatorRef);
      const newStatus = response === 'confirm' ? 'verified' : 'rejected';
      transaction.update(requestRef, { status: newStatus });

      const validationRef = db.collection('validations').doc();
      transaction.set(validationRef, {
        id: validationRef.id, requestId, validatorId, response,
        timestamp: new Date().toISOString()
      });

      if (response === 'confirm') {
        const earningRef = db.collection('earnings').doc();
        transaction.set(earningRef, {
          id: earningRef.id, validatorId, requestId,
          payoutAmount: REWARD_AMOUNT, status: 'pending'
        });
        if (validatorDoc.exists) {
          transaction.update(validatorRef, {
            earnings: (validatorDoc.data()?.earnings || 0) + REWARD_AMOUNT,
            trustScore: (validatorDoc.data()?.trustScore || 50) + 10,
            totalValidations: (validatorDoc.data()?.totalValidations || 0) + 1,
          });
        }
      } else {
        if (validatorDoc.exists) {
          transaction.update(validatorRef, {
            totalValidations: (validatorDoc.data()?.totalValidations || 0) + 1,
          });
        }
      }

      return { newStatus, reward: response === 'confirm' ? REWARD_AMOUNT : 0 };
    });

    return NextResponse.json({
      success: true,
      message: `Request ${transactionResult.newStatus}.`,
      rewardEarned: transactionResult.reward
    }, { status: 200 });

  } catch (error: any) {
    console.error('Validation Error:', error);
    const status = error.message.includes('already been validated') ? 409 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
