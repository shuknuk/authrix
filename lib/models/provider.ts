import { getOllamaCloudConfig, isOllamaCloudConfigured, resolveModelProvider } from "@/lib/models/config";
import type { ModelProvider, ModelLayerStatus } from "@/types/models";
import { createOllamaCloudProvider } from "@/lib/models/providers/ollama-cloud";
import { getAgentModelRegistry, getRouterModel } from "@/lib/models/registry";

const LOCAL_PROVIDER: ModelProvider = {
  provider: "local",
  configured: false,
  async chat() {
    throw new Error("No live model provider is configured.");
  },
};

export function getModelProvider(): ModelProvider {
  const provider = resolveModelProvider();

  if (provider === "ollama-cloud" && isOllamaCloudConfigured()) {
    return createOllamaCloudProvider();
  }

  return LOCAL_PROVIDER;
}

export function getModelLayerStatus(): ModelLayerStatus {
  const provider = resolveModelProvider();
  const ollama = getOllamaCloudConfig();
  const configured = provider === "ollama-cloud" ? isOllamaCloudConfigured() : false;
  const routerMode = resolveRouterMode();

  return {
    provider,
    configured,
    baseUrl: provider === "ollama-cloud" ? ollama.baseUrl : undefined,
    routerMode,
    routerModel: configured ? getRouterModel() : undefined,
    agentConfigs: getAgentModelRegistry(),
    description:
      provider === "ollama-cloud"
        ? configured
          ? "Authrix can route agent execution through Ollama Cloud."
          : "Authrix is pointed at Ollama Cloud but the API key or base URL is missing."
        : "Authrix is still using local deterministic routing and has no live LLM provider configured yet.",
  };
}

function resolveRouterMode() {
  const raw = process.env.AUTHRIX_ROUTER_EXECUTION?.trim().toLowerCase();
  if (raw === "model") {
    return "model" as const;
  }

  if (raw === "local") {
    return "local" as const;
  }

  return "auto" as const;
}
