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
      if (requestData?.status !== 'pending') throw new Error('Request has already been resolved or validated completely');

      // Location check (skip in simulation)
      if (!isSimulation && validatorLat !== undefined && validatorLng !== undefined) {
        const distance = calculateDistance(validatorLat, validatorLng, requestData?.lat, requestData?.lng);
        if (distance > 500) {
          throw new Error(`Location Verification Failed: You are ${Math.round(distance)}m away. Must be within 500m.`);
        }
      }

      // Add vote
      const validationRef = db.collection('validations').doc();
      const validatorDoc = await transaction.get(validatorRef);
      const trustScore = validatorDoc.data()?.trustScore || 50;
      
      transaction.set(validationRef, {
        id: validationRef.id,
        requestId,
        validatorId,
        response,
        trustScore,
        timestamp: new Date().toISOString()
      });

      // Trust Engine Logic: Gather all validations to check for majority
      const validationsSnapshot = await db.collection('validations').where('requestId', '==', requestId).get();
      
      // We manually add the IN-FLIGHT vote we just placed because it is part of this transaction
      const allVotes = validationsSnapshot.docs.map((d: any) => d.data());
      allVotes.push({ requestId, validatorId, response, trustScore });

      // Deduplicate in case of weird double submissions
      const uniqueVotesCheck = new Set();
      const filteredVotes = allVotes.filter((v: any) => {
        if (uniqueVotesCheck.has(v.validatorId)) return false;
        uniqueVotesCheck.add(v.validatorId);
        return true;
      });

      const REQUIRED_VOTES = 2; // Min 2 for majority logic in V1
      
      if (filteredVotes.length < REQUIRED_VOTES) {
        // Not enough data yet
        return { newStatus: 'pending', complete: false, reward: 0 };
      }

      // Calculate Weighted Majority
      // Weight = trustScore / 50
      let confirmWeight = 0;
      let rejectWeight = 0;

      filteredVotes.forEach((v: any) => {
        const weight = Math.max(0.1, v.trustScore / 50);
        if (v.response === 'confirm') confirmWeight += weight;
        else rejectWeight += weight;
      });

      const REWARD_AMOUNT = requestData?.bounty || 10;
      let finalDecision: 'verified' | 'rejected' | null = null;

      // Arbitrary delta to confirm consensus
      if (confirmWeight > rejectWeight + 0.5) finalDecision = 'verified';
      else if (rejectWeight > confirmWeight + 0.5) finalDecision = 'rejected';

      if (!finalDecision) {
        // Conflicting, wait for more validators
        return { newStatus: 'under_review', complete: false, reward: 0 };
      }

      // Consensus Reached! Update DB
      transaction.update(requestRef, { status: finalDecision });

      // Calculate distributions based on outcome
      for (const v of filteredVotes) {
        const isCorrect = v.response === (finalDecision === 'verified' ? 'confirm' : 'reject');
        const vRef = db.collection('users').doc(v.validatorId);
        const vDoc = await transaction.get(vRef);
        
        if (vDoc.exists) {
          const currentData = vDoc.data() || {};
          let newTrust = currentData.trustScore || 50;
          let newEarnings = currentData.earnings || 0;
          
          if (isCorrect) {
            newTrust += 10;
            if (finalDecision === 'verified') {
               newEarnings += REWARD_AMOUNT; // Earn only on truth confirmation, or if 'reject' gave bounty too
               const earningRef = db.collection('earnings').doc();
               transaction.set(earningRef, {
                 id: earningRef.id, validatorId: v.validatorId, requestId,
                 payoutAmount: REWARD_AMOUNT, status: 'paid'
               });
            }
          } else {
            newTrust -= 20; // Penalize incorrect
          }
          
          transaction.update(vRef, {
            trustScore: Math.max(0, newTrust),
            earnings: parseFloat(newEarnings.toString()) || 0,
            totalValidations: (currentData.totalValidations || 0) + 1
          });
        }
      }

      return { newStatus: finalDecision, complete: true, reward: finalDecision === 'verified' ? REWARD_AMOUNT : 0 };
    });

    if (transactionResult.complete) {
       return NextResponse.json({
         success: true,
         message: `Network consensus reached: ${transactionResult.newStatus}.`,
         resolved: true
       }, { status: 200 });
    } else {
       return NextResponse.json({
         success: true,
         message: `Validation logged. Waiting for more verifications.`,
         resolved: false
       }, { status: 200 });
    }

  } catch (error: any) {
    console.error('[API] Validation Error:', error);
    const msg = error?.message || 'Unknown error occurred during validation';
    const status = msg.includes('has already been resolved') ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
