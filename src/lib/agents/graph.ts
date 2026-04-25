import { StateGraph, START, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";
import { ChatGoogleGenerativeAI } from "@langchain/google-genai";
import { AIMessage, HumanMessage, SystemMessage, ToolMessage } from "@langchain/core/messages";
import { AgentState, agentStateChannels } from "./state";
import { agentTools } from "./tools";

// ─── MOCK AI MODEL ────────────────────────────────────────────────────────────
// Used when GEMINI_API_KEY is not set. Simulates a 3-turn conversation:
// Turn 1 (triage): returns JSON risk classification
// Turn 2 (manager, no prior tool results): calls both tools
// Turn 3 (manager, after tool results are in messages): returns final summary
// ─────────────────────────────────────────────────────────────────────────────
const createMockModel = () => ({
  invoke: async (messages: any[]): Promise<AIMessage> => {
    // Check if any ToolMessages are already in the conversation
    const hasToolResults = messages.some(
      (m: any) => m._getType?.() === "tool" || m.constructor?.name === "ToolMessage"
    );

    // Turn 1 — Triage: classify risk
    const lastContent = messages[messages.length - 1]?.content?.toString() || "";
    if (lastContent.includes("Classify the risk level")) {
      console.log("[Mock AI] Turn 1 — Triage response");
      return new AIMessage({ content: '{"risk": "HIGH"}' });
    }

    // Turn 2 — Manager: decide to call tools (only if NO tool results yet)
    if (!hasToolResults) {
      console.log("[Mock AI] Turn 2 — Calling tools");
      return new AIMessage({
        content: "I need to calculate the bounty and find nearby validators.",
        tool_calls: [
          {
            name: "calculate_dynamic_bounty",
            args: { riskLevel: "HIGH" },
            id: "tc_bounty_001",
            type: "tool_call",
          },
          {
            name: "find_nearby_validators",
            args: { crisisLocation: "reported crisis location", radiusInKm: 5 },
            id: "tc_validators_001",
            type: "tool_call",
          },
        ],
      });
    }

    // Turn 3 — Manager: after tools ran, produce final conclusion (NO tool_calls)
    console.log("[Mock AI] Turn 3 — Final summary (no more tool calls)");
    return new AIMessage({
      content:
        "Crisis assessed as HIGH risk. Dynamic bounty of ₹100 assigned based on severity. " +
        "Found 2 validators within 5km — best match is Priya S. (trust score: 92). " +
        "Validators have been notified and the crisis is being actively managed.",
    });
  },
});

// ─── REAL MODEL ───────────────────────────────────────────────────────────────
const getModel = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "") {
    console.log("[Graph] No GEMINI_API_KEY — using Mock AI Model");
    return createMockModel() as any;
  }
  console.log("[Graph] Using real Gemini model");
  return new ChatGoogleGenerativeAI({
    apiKey,
    modelName: "gemini-1.5-flash",
    maxOutputTokens: 2048,
    temperature: 0.2,
  }).bindTools(agentTools);
};

// ─── NODE 1: TRIAGE ──────────────────────────────────────────────────────────
const triageCrisis = async (state: AgentState): Promise<Partial<AgentState>> => {
  console.log("[Graph] ▶ TRIAGE node");
  const model = getModel();
  const response = await model.invoke([
    new HumanMessage(
      `Classify the risk level of this crisis as LOW, MEDIUM, or HIGH. ` +
      `Return ONLY a JSON object like {"risk": "HIGH"}. No markdown.\n\nCrisis: "${state.crisisRequest}"`
    ),
  ]);

  let riskLevel: "LOW" | "MEDIUM" | "HIGH" = "MEDIUM";
  try {
    const text = response.content.toString().replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(text);
    if (["LOW", "MEDIUM", "HIGH"].includes(parsed.risk)) riskLevel = parsed.risk;
  } catch {
    console.warn("[Graph] Triage parse failed — defaulting MEDIUM");
  }

  console.log(`[Graph] ✓ Risk: ${riskLevel}`);
  return { riskLevel, status: "SEARCHING_VALIDATORS" };
};

// ─── NODE 2: MANAGER ─────────────────────────────────────────────────────────
const manageCrisis = async (state: AgentState): Promise<Partial<AgentState>> => {
  console.log(`[Graph] ▶ MANAGER node (Risk: ${state.riskLevel}, Messages: ${state.messages.length})`);
  const model = getModel();

  const systemPrompt = new SystemMessage(
    `You are the Localyze Crisis Manager Agent. Crisis risk: ${state.riskLevel}.\n` +
    `Tasks:\n1. Use calculate_dynamic_bounty to determine validator reward.\n` +
    `2. Use find_nearby_validators to locate available validators within 5km.\n` +
    `3. After receiving tool results, provide a final summary with NO more tool calls.\n\n` +
    `Crisis: "${state.crisisRequest}"`
  );

  const msgs =
    state.messages.length > 0
      ? [systemPrompt, ...state.messages]
      : [systemPrompt, new HumanMessage(`Handle this ${state.riskLevel} risk crisis: ${state.crisisRequest}`)];

  const response = await model.invoke(msgs);
  return { messages: [response] };
};

// ─── NODE 3: EXTRACT RESULTS ─────────────────────────────────────────────────
const extractResults = async (state: AgentState): Promise<Partial<AgentState>> => {
  console.log("[Graph] ▶ EXTRACT node");
  let bountyAmount = state.riskLevel === "HIGH" ? 100 : state.riskLevel === "MEDIUM" ? 50 : 20;
  let validatorsFound: string[] = [];
  let assignedValidator: string | null = null;

  // Parse bounty and validator data from ToolMessages in state
  for (const msg of state.messages) {
    try {
      const content = (msg as any).content?.toString() || "";
      if (content.includes('"bounty"')) {
        const data = JSON.parse(content);
        if (typeof data.bounty === "number") bountyAmount = data.bounty;
      }
      if (content.includes('"validators"')) {
        const data = JSON.parse(content);
        if (Array.isArray(data.validators)) validatorsFound = data.validators;
        if (data.bestValidator?.id) assignedValidator = data.bestValidator.id;
      }
    } catch { /* skip non-JSON messages */ }
  }

  console.log(`[Graph] ✓ Bounty: ₹${bountyAmount} | Validators: ${validatorsFound.length} | Assigned: ${assignedValidator}`);
  return { bountyAmount, validatorsFound, assignedValidator, status: "COMPLETED" };
};

// ─── CONDITIONAL EDGE ────────────────────────────────────────────────────────
const shouldContinue = (state: AgentState): string => {
  const messages = state.messages;
  if (messages.length === 0) return "__end__";

  const lastMessage = messages[messages.length - 1] as AIMessage;
  const toolCalls = lastMessage?.tool_calls;

  if (toolCalls && toolCalls.length > 0) {
    console.log(`[Graph] → Routing to TOOLS: ${toolCalls.map((tc: any) => tc.name).join(", ")}`);
    return "tools";
  }

  console.log("[Graph] → Agent finished. Routing to EXTRACT.");
  return "__end__";
};

// ─── BUILD THE GRAPH ─────────────────────────────────────────────────────────
const toolNode = new ToolNode(agentTools);

const workflow = new StateGraph<AgentState>({ channels: agentStateChannels })
  .addNode("triage",   triageCrisis)
  .addNode("manager",  manageCrisis)
  .addNode("tools",    toolNode)
  .addNode("extract",  extractResults)
  .addEdge(START,      "triage")
  .addEdge("triage",   "manager")
  .addConditionalEdges("manager", shouldContinue, {
    tools:    "tools",
    __end__:  "extract",
  })
  .addEdge("tools",    "manager")
  .addEdge("extract",  END);

export const crisisAgentApp = workflow.compile();
console.log("[Graph] ✓ Crisis Agent workflow compiled");
