import type {
  JobStatus,
  RuntimeBridge,
  RuntimeStatus,
  Session,
  SessionConfig,
  ToolResult,
} from "@/types/runtime";
import { resolveOpenClawRuntimeConfig } from "./config";
import {
  OpenClawGatewayRequestError,
  withOpenClawGateway,
  type OpenClawHelloOk,
} from "./openclaw-client";

type OpenClawSessionEntry = {
  key?: string;
  sessionId?: string;
  label?: string;
  derivedTitle?: string;
  updatedAt?: number | string;
  createdAt?: number | string;
  agentId?: string;
  model?: string;
  modelOverride?: string;
  parentSessionKey?: string;
  childSessions?: string[];
};

type OpenClawCreateSessionResponse = {
  key?: string;
  sessionId?: string;
  entry?: OpenClawSessionEntry;
};

type OpenClawListSessionsResponse = {
  sessions?: OpenClawSessionEntry[];
};

type OpenClawAgentPayload = {
  text?: string;
  mediaUrl?: string | null;
  mediaUrls?: string[];
};

type OpenClawAgentResponse = {
  runId?: string;
  status?: string;
  summary?: string;
  result?: {
    payloads?: OpenClawAgentPayload[];
  };
};

const unsupportedJobs = new Map<string, JobStatus>();

export function createOpenClawBridge(): RuntimeBridge {
  const config = resolveOpenClawRuntimeConfig();
  const bridge: RuntimeBridge = {
    provider: "openclaw",

    async getStatus(): Promise<RuntimeStatus> {
      try {
        const hello = await withOpenClawGateway(config, async (connection) => connection.hello);

        return {
          provider: "openclaw",
          mode: "live",
          configured: true,
          healthy: true,
          description: "Authrix is connected to its live autonomous runtime engine.",
          checkedAt: new Date().toISOString(),
          url: config.url,
          agentId: config.defaultAgentId,
          availableMethods: hello.features.methods,
        };
      } catch (error) {
        return buildDisconnectedStatus(config.url, config.defaultAgentId, error);
      }
    },

    async executeAgent<TInput, TOutput>(request: {
      agentId: string;
      input: TInput;
      tools?: string[];
      sessionId?: string;
    }) {
      const start = Date.now();
      const runtimeAgentId = config.defaultAgentId ?? request.agentId;

      const response = await withOpenClawGateway(config, async (connection) =>
        connection.request<OpenClawAgentResponse>(
          "agent",
          {
            agentId: runtimeAgentId,
            sessionId: request.sessionId,
            message: buildAgentExecutionMessage(request.agentId, request.input, request.tools),
            timeout: Math.max(1, Math.ceil(config.timeoutMs / 1000)),
          },
          { expectFinal: true }
        )
      );

      const output = parseAgentOutput<TOutput>(response, request.agentId);

      return {
        output,
        metadata: {
          executionTimeMs: Date.now() - start,
          timestamp: new Date().toISOString(),
          sessionId: request.sessionId,
          provider: "openclaw",
        },
      };
    },

    async createSession(configRequest: SessionConfig) {
      const response = await withOpenClawGateway(config, async (connection) =>
        connection.request<OpenClawCreateSessionResponse>("sessions.create", {
          key: configRequest.key,
          agentId: configRequest.agentId ?? config.defaultAgentId,
          label: configRequest.label,
          model: configRequest.model,
          parentSessionKey: configRequest.parentSessionKey,
        })
      );

      const key = response.key;
      const sessionId = response.sessionId ?? response.entry?.sessionId ?? key;

      if (!key || !sessionId) {
        throw new Error(
          "The runtime engine did not return a usable session key or session identifier."
        );
      }

      return {
        id: sessionId,
        label: response.entry?.label ?? configRequest.label,
        createdAt: normalizeTimestamp(response.entry?.createdAt),
        lastActiveAt: normalizeTimestamp(response.entry?.updatedAt),
        metadata: {
          openclawKey: key,
          agentId: configRequest.agentId ?? config.defaultAgentId,
          model: configRequest.model,
          parentSessionKey: configRequest.parentSessionKey,
        },
      };
    },

    async getSession(sessionId: string) {
      const sessions = await bridge.listSessions();
      return (
        sessions.find(
          (session) =>
            session.id === sessionId || session.metadata.openclawKey === sessionId
        ) ?? null
      );
    },

    async listSessions() {
      const response = await withOpenClawGateway(config, async (connection) =>
        connection.request<OpenClawListSessionsResponse>("sessions.list", {
          limit: 50,
          includeDerivedTitles: true,
        })
      );

      return (response.sessions ?? []).map(mapOpenClawSessionEntry);
    },

    async invokeTool(request: {
      tool: string;
      args: Record<string, unknown>;
      sessionId?: string;
    }): Promise<ToolResult> {
      return {
        success: false,
        output: null,
        error: `Runtime tool invocation is not mapped yet for "${request.tool}".`,
      };
    },

    async submitJob(request: {
      type: string;
      payload: Record<string, unknown>;
      schedule?: string;
    }) {
      const jobId = `job_openclaw_${Date.now()}`;
      unsupportedJobs.set(jobId, {
        id: jobId,
        state: "failed",
        createdAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        error: `Runtime job submission is not mapped yet for "${request.type}".`,
      });
      return jobId;
    },

    async getJobStatus(jobId: string) {
      return (
        unsupportedJobs.get(jobId) ?? {
          id: jobId,
          state: "failed",
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
          error: "Job not found.",
        }
      );
    },
  };

  return bridge;
}

function buildDisconnectedStatus(
  url: string,
  agentId: string | undefined,
  error: unknown
): RuntimeStatus {
  const message =
    error instanceof Error ? error.message : "Could not reach the configured Authrix runtime endpoint.";

  return {
    provider: "openclaw",
    mode: "disconnected",
    configured: true,
    healthy: false,
    description: message,
    checkedAt: new Date().toISOString(),
    url,
    agentId,
  };
}

function mapOpenClawSessionEntry(entry: OpenClawSessionEntry): Session {
  const sessionId = entry.sessionId ?? entry.key ?? `openclaw-${Date.now()}`;

  return {
    id: sessionId,
    label: entry.label ?? entry.derivedTitle ?? entry.key,
    createdAt: normalizeTimestamp(entry.createdAt),
    lastActiveAt: normalizeTimestamp(entry.updatedAt ?? entry.createdAt),
    metadata: {
      openclawKey: entry.key,
      agentId: entry.agentId,
      model: entry.modelOverride ?? entry.model,
      parentSessionKey: entry.parentSessionKey,
      childSessions: entry.childSessions ?? [],
    },
  };
}

function normalizeTimestamp(value: number | string | undefined): string {
  if (typeof value === "number") {
    return new Date(value).toISOString();
  }

  if (typeof value === "string" && value.trim().length > 0) {
    const timestamp = Number.isNaN(Date.parse(value))
      ? new Date().toISOString()
      : new Date(value).toISOString();
    return timestamp;
  }

  return new Date().toISOString();
}

function buildAgentExecutionMessage(
  agentId: string,
  input: unknown,
  tools?: string[]
): string {
  return [
    `You are running as the Authrix "${agentId}" product agent inside the autonomous runtime.`,
    "Return JSON only with no markdown fences, commentary, or prose before/after the JSON.",
    tools && tools.length > 0
      ? `Tools requested for this run: ${tools.join(", ")}.`
      : "No tool usage is required unless the runtime configuration explicitly enables it.",
    "Use the following input JSON as the source of truth for this turn:",
    JSON.stringify(input, null, 2),
  ].join("\n\n");
}

function parseAgentOutput<TOutput>(
  response: OpenClawAgentResponse,
  agentId: string
): TOutput {
  const text = extractPayloadText(response);

  if (!text) {
    throw new Error(
      `The runtime engine returned no text payload for the Authrix "${agentId}" agent.`
    );
  }

  const directJson = tryParseJson<TOutput>(text);
  if (directJson.ok) {
    return directJson.value;
  }

  const fencedJson = text.match(/```json\s*([\s\S]*?)```/i)?.[1];
  if (fencedJson) {
    const parsed = tryParseJson<TOutput>(fencedJson);
    if (parsed.ok) {
      return parsed.value;
    }
  }

  const objectCandidate = extractFirstJsonCandidate(text);
  if (objectCandidate) {
    const parsed = tryParseJson<TOutput>(objectCandidate);
    if (parsed.ok) {
      return parsed.value;
    }
  }

  throw new Error(
    `The runtime engine did not return valid JSON for the Authrix "${agentId}" agent. Configure the runtime worker to emit JSON-only responses.`
  );
}

function extractPayloadText(response: OpenClawAgentResponse): string {
  const payloads = response.result?.payloads ?? [];
  const text = payloads
    .map((payload) => payload.text?.trim())
    .filter((value): value is string => Boolean(value))
    .join("\n");

  return text || response.summary?.trim() || "";
}

function tryParseJson<T>(
  value: string
): { ok: true; value: T } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(value) as T };
  } catch {
    return { ok: false };
  }
}

function extractFirstJsonCandidate(value: string): string | null {
  const objectStart = value.indexOf("{");
  const objectEnd = value.lastIndexOf("}");
  if (objectStart !== -1 && objectEnd > objectStart) {
    return value.slice(objectStart, objectEnd + 1);
  }

  const arrayStart = value.indexOf("[");
  const arrayEnd = value.lastIndexOf("]");
  if (arrayStart !== -1 && arrayEnd > arrayStart) {
    return value.slice(arrayStart, arrayEnd + 1);
  }

  return null;
}
