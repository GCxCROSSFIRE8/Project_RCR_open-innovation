import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebase-admin';
import * as geofire from 'geofire-common';
import { crisisAgentApp } from '@/lib/agents/graph';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const db = getAdminDb(true);
    const { userId, text, lat, lng, paymentDocId } = body;

    if (!userId || !text || lat === undefined || lng === undefined || !paymentDocId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // 1. Run Autonomous Agent
    console.log('[API] Triggering Autonomous Crisis Agent...');
    const agentState = await crisisAgentApp.invoke({
      crisisRequest: text,
      messages: [],
    });
    console.log(`[API] Agent done. Risk: ${agentState.riskLevel}, Bounty: ₹${agentState.bountyAmount}`);

    // 2. Verify Payment and create Request in a transaction
    const paymentRef = db.collection('payments').doc(paymentDocId);

    const newRequestData = await db.runTransaction(async (transaction: any) => {
      const paymentDoc = await transaction.get(paymentRef);
      if (!paymentDoc.exists) throw new Error('Payment record not found');

      const paymentData = paymentDoc.data();
      const isPaid = paymentData?.status === 'paid' || paymentData?.status === 'simulated_paid';
      if (!isPaid) throw new Error('Payment is not verified');
      if (paymentData?.usedForRequest) throw new Error('Payment already used');
      if (paymentData?.userId !== userId) throw new Error('Payment user mismatch');

      const requestRef = db.collection('requests').doc();
      const geohash = geofire.geohashForLocation([lat, lng]);

      // Extract the AI's final summary message
      const messages = agentState.messages || [];
      const lastMsg = messages[messages.length - 1];
      const aiSummary = lastMsg?.content?.toString().slice(0, 200) || 'Agent processed this crisis.';

      const payload = {
        id: requestRef.id,
        userId,
        text,
        lat,
        lng,
        geohash,
        status: 'pending',
        // Agent outputs
        risk: agentState.riskLevel || 'MEDIUM',
        bounty: agentState.bountyAmount || 50,
        agentStatus: agentState.status || 'COMPLETED',
        // AI summary from agent messages
        aiSummary,
        aiAdvice: `Dynamic bounty of ₹${agentState.bountyAmount} assigned. Validators notified within 5km radius.`,
        paymentId: paymentDocId,
        createdAt: new Date().toISOString(),
      };

      transaction.set(requestRef, payload);
      transaction.update(paymentRef, { usedForRequest: true, requestId: requestRef.id });

      return payload;
    });

    return NextResponse.json({ success: true, request: newRequestData }, { status: 201 });

  } catch (error: any) {
    console.error('Error creating request:', error);
    const status = error.message?.includes('Payment') ? 403 : 500;
    return NextResponse.json({ error: error.message }, { status });
  }
}
