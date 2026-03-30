import type { ModelProviderId } from "@/types/models";

const DEFAULT_OLLAMA_BASE_URL = "https://ollama.com/api";

export function resolveModelProvider(): ModelProviderId {
  const raw = process.env.AUTHRIX_MODEL_PROVIDER?.trim().toLowerCase();
  return raw === "ollama-cloud" ? "ollama-cloud" : "local";
}

export function getOllamaCloudConfig() {
  return {
    baseUrl: readStringEnv("OLLAMA_BASE_URL") ?? DEFAULT_OLLAMA_BASE_URL,
    apiKey: readStringEnv("OLLAMA_API_KEY"),
  };
}

export function isOllamaCloudConfigured(): boolean {
  const config = getOllamaCloudConfig();
  return Boolean(config.baseUrl && config.apiKey);
}

export function resolveRouterExecutionMode(): "local" | "auto" | "model" {
  const raw = process.env.AUTHRIX_ROUTER_EXECUTION?.trim().toLowerCase();
  if (raw === "model") {
    return "model";
  }

  if (raw === "local") {
    return "local";
  }

  return "auto";
}

export function readAgentModelOverride(name: string): string | undefined {
  return readStringEnv(name);
}

function readStringEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}
