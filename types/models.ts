import type { AgentId } from "@/types/agents";

export type ModelProviderId = "local" | "ollama-cloud";
export type RoutedAgentId = Exclude<AgentId, "task">;
export type AgentExecutionProfile = "premium" | "balanced" | "fast";

export interface ModelChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ModelProviderChatRequest {
  model: string;
  messages: ModelChatMessage[];
  temperature?: number;
  format?: "json";
}

export interface ModelProviderChatResponse {
  model: string;
  content: string;
  raw: unknown;
}

export interface ModelProvider {
  readonly provider: ModelProviderId;
  readonly configured: boolean;
  chat(request: ModelProviderChatRequest): Promise<ModelProviderChatResponse>;
}

export interface AgentModelConfig {
  agentId: RoutedAgentId;
  provider: ModelProviderId;
  defaultModel: string;
  executionProfile: AgentExecutionProfile;
  roleLabel: string;
}

export interface RouteDecision {
  agentId: RoutedAgentId;
  confidence: "low" | "medium" | "high";
  reason: string;
  mode: "deterministic" | "model";
  model?: string;
}

export interface ModelLayerStatus {
  provider: ModelProviderId;
  configured: boolean;
  baseUrl?: string;
  routerMode: "local" | "auto" | "model";
  routerModel?: string;
  agentConfigs: AgentModelConfig[];
  description: string;
}
