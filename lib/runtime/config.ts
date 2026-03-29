import type { RuntimeProvider } from "@/types/runtime";

const DEFAULT_OPENCLAW_GATEWAY_URL = "ws://127.0.0.1:18789";
const DEFAULT_OPENCLAW_TIMEOUT_MS = 30_000;

export interface OpenClawRuntimeConfig {
  provider: "openclaw";
  url: string;
  token?: string;
  password?: string;
  timeoutMs: number;
  defaultAgentId?: string;
}

export function resolveRuntimeProvider(): RuntimeProvider {
  const raw = process.env.AUTHRIX_RUNTIME?.trim().toLowerCase();
  return raw === "openclaw" ? "openclaw" : "mock";
}

export function resolveOpenClawRuntimeConfig(): OpenClawRuntimeConfig {
  return {
    provider: "openclaw",
    url: readStringEnv("OPENCLAW_GATEWAY_URL") ?? DEFAULT_OPENCLAW_GATEWAY_URL,
    token: readStringEnv("OPENCLAW_GATEWAY_TOKEN"),
    password: readStringEnv("OPENCLAW_GATEWAY_PASSWORD"),
    timeoutMs: readNumberEnv("OPENCLAW_GATEWAY_TIMEOUT_MS") ?? DEFAULT_OPENCLAW_TIMEOUT_MS,
    defaultAgentId: readStringEnv("OPENCLAW_AGENT_ID"),
  };
}

function readStringEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function readNumberEnv(name: string): number | undefined {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return undefined;
  }

  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : undefined;
}
