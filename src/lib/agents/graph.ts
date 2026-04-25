import { StateGraph, START, END } from "@langchain/langgraph";
import { AgentState, agentStateChannels } from "./state";

import { triageCrisis } from "./nodes/triage";
import { classifierNode } from "./nodes/classifier";
import { spamDetectionNode } from "./nodes/spam_detection";
import { ragRetrievalNode } from "./nodes/retrieval";
import { decisionNode } from "./nodes/decision";

// ─── BUILD THE MULTI-AGENT GRAPH ─────────────────────────────────────────────

const workflow = new StateGraph<AgentState>({ channels: agentStateChannels })
  // Add Nodes
  .addNode("triage", triageCrisis)
  .addNode("classifier", classifierNode)
  .addNode("spam_detection", spamDetectionNode)
  .addNode("retrieval", ragRetrievalNode)
  .addNode("decision", decisionNode)
  
  // Connect Edges SEQUENTIALLY
  .addEdge(START, "spam_detection")
  
  // Conditional routing post-spam
  .addConditionalEdges("spam_detection", (state: AgentState) => {
    if (state.isSpam) {
      console.log("[Graph] Spam detected. Skipping to decision.");
      return "decision"; // Skip expensive ops
    }
    return "triage";
  }, {
    triage: "triage",
    decision: "decision"
  })

  // Continue linear execution if not spam
  .addEdge("triage", "classifier")
  .addEdge("classifier", "retrieval")
  .addEdge("retrieval", "decision")
  .addEdge("decision", END);

export const crisisAgentApp = workflow.compile();

console.log("[Graph] ✓ Localyze Multi-Agent workflow compiled (Spam -> Triage -> Classifier -> RAG -> Decision)");
