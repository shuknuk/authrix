import { readAgentModelOverride, resolveModelProvider } from "@/lib/models/config";
import type { AgentModelConfig, RoutedAgentId } from "@/types/models";

const DEFAULT_MODELS: Record<RoutedAgentId, { model: string; executionProfile: AgentModelConfig["executionProfile"]; roleLabel: string }> =
  {
    engineer: {
      model: "gpt-oss:120b",
      executionProfile: "premium",
      roleLabel: "Engineering",
    },
    docs: {
      model: "llama3.1",
      executionProfile: "fast",
      roleLabel: "Docs",
    },
    workflow: {
      model: "llama3.1",
      executionProfile: "fast",
      roleLabel: "Workflow",
    },
    devops: {
      model: "deepseek-r1:8b",
      executionProfile: "premium",
      roleLabel: "DevOps",
    },
  };

export function getAgentModelRegistry(): AgentModelConfig[] {
  const provider = resolveModelProvider();

  return (Object.keys(DEFAULT_MODELS) as RoutedAgentId[]).map((agentId) => {
    const defaults = DEFAULT_MODELS[agentId];
    const overrideName = `AUTHRIX_MODEL_${agentId.toUpperCase()}`;

    return {
      agentId,
      provider,
      defaultModel: readAgentModelOverride(overrideName) ?? defaults.model,
      executionProfile: defaults.executionProfile,
      roleLabel: defaults.roleLabel,
    };
  });
}

export function getDefaultModelForAgent(agentId: RoutedAgentId): string {
  return (
    getAgentModelRegistry().find((entry) => entry.agentId === agentId)?.defaultModel ??
    DEFAULT_MODELS[agentId].model
  );
}

export function getRouterModel(): string {
  return readAgentModelOverride("AUTHRIX_MODEL_ROUTER") ?? "llama3.1";
}
