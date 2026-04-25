import { AgentState } from "../state";
import { SystemMessage, HumanMessage } from "@langchain/core/messages";
import { getModel } from "../utils";

export const decisionNode = async (state: AgentState): Promise<Partial<AgentState>> => {
  console.log("[Node: Decision] Aggregating final structured JSON output...");
  
  const model = getModel();
  if (!model) {
    return {
      summary: state.crisisRequest,
      priorityScore: state.riskLevel === 'HIGH' ? 90 : state.riskLevel === 'MEDIUM' ? 60 : 30,
      bountyAmount: state.riskLevel === 'HIGH' ? 100 : 50,
      status: 'COMPLETED'
    };
  }

  const systemPrompt = `You are the Localyze Decision Engine. 
Create a final structured response based on the previous agent results.
Risk Level: ${state.riskLevel}
Category: ${state.category}
Spam Detection: ${state.isSpam}
Similar Past Events (RAG): ${state.ragContext}

Return ONLY valid JSON exactly matching this schema:
{
  "riskLevel": "LOW" | "MEDIUM" | "HIGH",
  "category": "string",
  "priorityScore": number (0-100),
  "isSpam": boolean,
  "summary": "String summarizing the crisis efficiently",
  "dynamicBounty": number (10 to 150 INR based on priority)
}`;

  const response = await model.invoke([
    new SystemMessage(systemPrompt),
    new HumanMessage(`Finalize report for: "${state.crisisRequest}"`)
  ]);

  try {
    const rawContent = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    const text = rawContent.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(text) as {
      riskLevel?: "LOW" | "MEDIUM" | "HIGH";
      category?: string;
      priorityScore?: number;
      isSpam?: boolean;
      summary?: string;
      dynamicBounty?: number;
    };
    
    return {
      riskLevel: parsed.riskLevel || 'MEDIUM',
      category: parsed.category || 'general',
      priorityScore: parsed.priorityScore || 50,
      isSpam: !!parsed.isSpam,
      summary: parsed.summary || state.crisisRequest,
      bountyAmount: parsed.dynamicBounty || 50,
      status: 'COMPLETED' as const
    };
  } catch (e) {
    console.warn("[Node: Decision] Parse failed heavily falling back");
    return {
      summary: "Aggregation failed, raw data processed.",
      priorityScore: 50,
      status: 'COMPLETED' as const
    };
  }
};
