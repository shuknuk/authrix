// ---------------------------------------------------------------------------
// Agent input/output contracts
// Each agent accepts typed input and returns structured typed output.
// ---------------------------------------------------------------------------

import type {
  EngineeringActivity,
  EngineeringSummary,
  SuggestedTask,
  CostReport,
  CostBreakdownItem,
  CostAnomaly,
} from "./domain";

// --- Engineer agent ---

export interface EngineerAgentInput {
  activities: EngineeringActivity[];
  period: { start: string; end: string };
}

export interface EngineerAgentOutput {
  summary: EngineeringSummary;
}

// --- Task agent ---

export interface TaskAgentInput {
  summary: EngineeringSummary;
  existingTasks?: SuggestedTask[];
}

export interface TaskAgentOutput {
  tasks: SuggestedTask[];
}

// --- DevOps agent ---

export interface DevOpsAgentInput {
  costBreakdown: CostBreakdownItem[];
  anomalies: CostAnomaly[];
  period: { start: string; end: string };
  totalSpend: number;
  currency: string;
}

export interface DevOpsAgentOutput {
  report: CostReport;
}

// --- Generic agent execution wrapper ---

export type AgentId = "engineer" | "task" | "devops";

export interface AgentRunResult<T> {
  agentId: AgentId;
  output: T;
  executionTimeMs: number;
  timestamp: string;
}
