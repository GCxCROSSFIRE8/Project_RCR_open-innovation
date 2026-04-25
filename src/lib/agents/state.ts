import { BaseMessage } from "@langchain/core/messages";

export interface AgentState {
  messages: BaseMessage[];
  crisisRequest: string;
  
  // Triage & Category
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  category: string | null;
  
  // Spam & Priority
  isSpam: boolean | null;
  priorityScore: number | null;
  
  // RAG
  ragContext: string;
  
  // Final Output
  summary: string | null;
  
  // Legacy fields (Bounty & Validation)
  bountyAmount: number;
  
  status: 'ANALYZING' | 'TRIAGED' | 'CLASSIFIED' | 'CHECKED_SPAM' | 'RAG_COMPLETE' | 'COMPLETED';
}

export const agentStateChannels = {
  messages: {
    value: (x: BaseMessage[], y: BaseMessage[]) => x.concat(y),
    default: () => [],
  },
  crisisRequest: {
    value: (x: string, y: string) => y ?? x,
    default: () => "",
  },
  riskLevel: {
    value: (x: 'LOW' | 'MEDIUM' | 'HIGH' | null, y: 'LOW' | 'MEDIUM' | 'HIGH' | null) => y ?? x,
    default: () => null,
  },
  category: {
    value: (x: string | null, y: string | null) => y ?? x,
    default: () => null,
  },
  isSpam: {
    value: (x: boolean | null, y: boolean | null) => y ?? x,
    default: () => null,
  },
  priorityScore: {
    value: (x: number | null, y: number | null) => y ?? x,
    default: () => null,
  },
  ragContext: {
    value: (x: string, y: string) => y ?? x,
    default: () => "",
  },
  summary: {
    value: (x: string | null, y: string | null) => y ?? x,
    default: () => null,
  },
  bountyAmount: {
    value: (x: number, y: number) => y ?? x,
    default: () => 50,
  },
  status: {
    value: (x: AgentState['status'], y: AgentState['status']) => y ?? x,
    default: (): AgentState['status'] => 'ANALYZING' as const,
  }
};
