import { AgentState } from "../state";
import { HumanMessage } from "@langchain/core/messages";
import { getModel } from "../utils";

export const classifierNode = async (state: AgentState): Promise<Partial<AgentState>> => {
  console.log("[Node: Classifier] Detecting category...");
  
  const model = getModel();
  if (!model) {
    return { category: 'general', status: 'CLASSIFIED' };
  }

  const response = await model.invoke([
    new HumanMessage(`Classify the category of this crisis (e.g., accident, flood, traffic, medical, infrastructure). Return ONLY a JSON object like {"category": "accident"}. No markdown.\n\nCrisis: "${state.crisisRequest}"`)
  ]);

  let category = "general";
  try {
    const rawContent = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    const text = rawContent.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(text) as { category?: string };
    if (parsed.category) category = parsed.category.toLowerCase();
  } catch (e) {
    console.warn("[Node: Classifier] Parse failed");
  }

  return { category, status: 'CLASSIFIED' as const };
};
