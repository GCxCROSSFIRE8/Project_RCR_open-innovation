import { NextResponse } from 'next/server';
import { crisisAgentApp } from '@/lib/agents/graph';

export async function POST(req: Request) {
  try {
    const { crisisRequest } = await req.json();

    if (!crisisRequest) {
      return NextResponse.json({ error: 'Missing crisis request text' }, { status: 400 });
    }

    console.log(`[API /agent-run] Starting agent for: "${crisisRequest.slice(0, 60)}..."`);

    const finalState = await crisisAgentApp.invoke({
      crisisRequest,
      messages: [],
    });

    return NextResponse.json({
      success: true,
      riskLevel: finalState.riskLevel,
      bountyAmount: finalState.bountyAmount,
      status: finalState.status,
      validatorsFound: finalState.validatorsFound,
      assignedValidator: finalState.assignedValidator,
    });

  } catch (error: any) {
    console.error('[API /agent-run] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to run agent' }, { status: 500 });
  }
}
