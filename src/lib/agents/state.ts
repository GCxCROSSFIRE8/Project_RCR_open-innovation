import { BaseMessage } from "@langchain/core/messages";

export interface AgentState {
  messages: BaseMessage[];
  crisisRequest: string;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | null;
  validatorsFound: string[];
  assignedValidator: string | null;
  bountyAmount: number;
  status: 'ANALYZING' | 'SEARCHING_VALIDATORS' | 'ASSIGNED' | 'ESCALATED' | 'COMPLETED';
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
  validatorsFound: {
    value: (x: string[], y: string[]) => x.concat(y),
    default: () => [],
  },
  assignedValidator: {
    value: (x: string | null, y: string | null) => y ?? x,
    default: () => null,
  },
  bountyAmount: {
    value: (x: number, y: number) => y ?? x,
    default: () => 50, // Default bounty
  },
  status: {
    value: (x: 'ANALYZING' | 'SEARCHING_VALIDATORS' | 'ASSIGNED' | 'ESCALATED' | 'COMPLETED', y: 'ANALYZING' | 'SEARCHING_VALIDATORS' | 'ASSIGNED' | 'ESCALATED' | 'COMPLETED') => y ?? x,
    default: () => 'ANALYZING',
  }
};
