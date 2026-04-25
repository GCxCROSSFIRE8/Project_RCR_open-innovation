import { AgentState } from "../state";
import { HumanMessage } from "@langchain/core/messages";
import { getModel } from "../utils";

export const spamDetectionNode = async (state: AgentState): Promise<Partial<AgentState>> => {
  console.log("[Node: Spam] Checking content quality...");
  
  const model = getModel();
  if (!model) {
    return { isSpam: false, status: 'CHECKED_SPAM' };
  }

  const response = await model.invoke([
    new HumanMessage(`Evaluate if this crisis report is spam (e.g. gibberish, promotional, irrelevant). Return {"isSpam": true} or {"isSpam": false}. \n\nReport: "${state.crisisRequest}"`)
  ]);

  let isSpam = false;
  try {
    const rawContent = typeof response.content === 'string' ? response.content : JSON.stringify(response.content);
    const text = rawContent.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(text) as { isSpam?: boolean };
    if (typeof parsed.isSpam === 'boolean') isSpam = parsed.isSpam;
  } catch (e) {
    console.warn("[Node: Spam] Parse failed");
  }

  return { isSpam, status: 'CHECKED_SPAM' as const };
};
