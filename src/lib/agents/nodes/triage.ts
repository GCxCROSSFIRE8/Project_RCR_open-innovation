import { AgentState } from "../state";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { HumanMessage } from "@langchain/core/messages";
import { getModel } from "../utils"; // We'll create this to share the model instance

export const triageCrisis = async (state: AgentState): Promise<Partial<AgentState>> => {
  console.log("[Node: Triage] Analyzing crisis risk...");
  
  const model = getModel();
  
  if (!model) {
    // Mock Behavior
    const text = state.crisisRequest.toLowerCase();
    const isHigh = text.includes("fire") || text.includes("accident") || text.includes("flood");
    return { riskLevel: isHigh ? 'HIGH' : 'MEDIUM', status: 'TRIAGED' };
  }

  const response = await model.invoke([
    new HumanMessage(`Classify the risk level of this crisis as LOW, MEDIUM, or HIGH. Return ONLY a JSON object like {"riskLevel": "HIGH"}. No markdown.\n\nCrisis: "${state.crisisRequest}"`)
  ]);

  let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "MEDIUM";
  try {
    const rawContent = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    const text = rawContent.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(text) as { riskLevel?: string };
    if (parsed.riskLevel && ["LOW", "MEDIUM", "HIGH"].includes(parsed.riskLevel)) {
      riskLevel = parsed.riskLevel as "LOW" | "MEDIUM" | "HIGH";
    }
  } catch (e) {
    console.warn("[Node: Triage] Parse failed, defaulting to MEDIUM");
  }

  return { riskLevel, status: 'TRIAGED' as const };
};
