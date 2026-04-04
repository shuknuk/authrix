import {
  appendRuntimeTranscriptEvent,
  createRuntimeRunRecord,
  ensureRuntimeSessionRecord,
  getRuntimeSessionRecord,
  listRuntimeRuns,
  listRuntimeSessions,
  touchRuntimeSession,
  updateRuntimeRunRecord,
} from "@/lib/runtime/store";
import type {
  RuntimeBridge,
  RuntimeSessionOrigin,
  RuntimeStatus,
  Session,
  SessionConfig,
  ToolResult,
} from "@/types/runtime";

const RECENT_RUN_WINDOW_MS = 24 * 60 * 60 * 1000;

export function createPersistentRuntimeBridge(baseBridge: RuntimeBridge): RuntimeBridge {
  const bridge: RuntimeBridge = {
    provider: baseBridge.provider,

    async getStatus(): Promise<RuntimeStatus> {
      const [status, sessions, runs] = await Promise.all([
        baseBridge.getStatus(),
        listRuntimeSessions(250),
        listRuntimeRuns(250),
      ]);

      const now = Date.now();
      const activeRunCount = runs.filter(
        (run) => run.status === "queued" || run.status === "running"
      ).length;
      const recentRunCount = runs.filter(
        (run) => now - new Date(run.createdAt).getTime() <= RECENT_RUN_WINDOW_MS
      ).length;

      return {
        ...status,
        sessionCount: sessions.length,
        activeRunCount,
        recentRunCount,
      };
    },

    async createSession(config: SessionConfig) {
      const session = await baseBridge.createSession(config);
      const origin = resolveOrigin(config.metadata);
      const persisted = await ensureRuntimeSessionRecord({
        session,
        origin,
      });

      await appendRuntimeTranscriptEvent({
        sessionId: persisted.id,
        role: "system",
        type: "session_created",
        content: `Session created for ${persisted.label ?? persisted.metadata.agentId ?? "Authrix runtime"}.`,
        metadata: {
          agentId: config.agentId,
          model: config.model,
          origin,
        },
      });

      return persisted;
    },

    async getSession(sessionId: string) {
      const persisted = await getRuntimeSessionRecord(sessionId);
      if (persisted) {
        return persisted;
      }

      const session = await baseBridge.getSession(sessionId);
      if (!session) {
        return null;
      }

      return ensureRuntimeSessionRecord({
        session,
        origin: resolveOrigin(session.metadata),
      });
    },

    async listSessions() {
      const liveSessions = await baseBridge.listSessions().catch(() => [] as Session[]);

      for (const session of liveSessions) {
        await ensureRuntimeSessionRecord({
          session,
          origin: resolveOrigin(session.metadata),
        });
      }

      return listRuntimeSessions(100);
    },

    async executeAgent<TInput, TOutput>(request: {
      agentId: string;
      input: TInput;
      tools?: string[];
      sessionId?: string;
    }) {
      const session =
        request.sessionId !== undefined
          ? await bridge.getSession(request.sessionId)
          : await bridge.createSession({
              agentId: request.agentId,
              label: buildFallbackSessionLabel(request.agentId),
              metadata: {
                origin: "system",
              },
            });
      if (!session) {
        throw new Error("Authrix could not resolve a runtime session for this execution.");
      }

      const origin = resolveOrigin(session.metadata);
      const startedAt = new Date().toISOString();
      const run = await createRuntimeRunRecord({
        sessionId: session.id,
        agentId: request.agentId,
        provider: baseBridge.provider,
        origin,
        status: "running",
        inputSummary: summarizePayload(request.input),
        tools: request.tools,
        metadata: {
          requestedTools: request.tools ?? [],
        },
      });

      await appendRuntimeTranscriptEvent({
        sessionId: session.id,
        runId: run.id,
        role: "system",
        type: "run_status",
        content: `Run started for ${request.agentId}.`,
        createdAt: startedAt,
        metadata: {
          agentId: request.agentId,
          provider: baseBridge.provider,
        },
      });

      await appendRuntimeTranscriptEvent({
        sessionId: session.id,
        runId: run.id,
        role: "user",
        type: "agent_input",
        content: summarizePayload(request.input, 800),
        createdAt: startedAt,
        metadata: {
          agentId: request.agentId,
          requestedTools: request.tools ?? [],
        },
      });

      await updateRuntimeRunRecord(run.id, {
        startedAt,
      });

      try {
        const result = await baseBridge.executeAgent<TInput, TOutput>({
          ...request,
          sessionId: session.id,
        });
        const completedAt = result.metadata.timestamp ?? new Date().toISOString();
        const outputSummary = summarizePayload(result.output, 800);

        await updateRuntimeRunRecord(run.id, {
          status: "completed",
          completedAt,
          outputSummary,
          metadata: {
            ...run.metadata,
            executionTimeMs: result.metadata.executionTimeMs,
            allowedTools: result.metadata.allowedTools ?? [],
            blockedTools: result.metadata.blockedTools ?? [],
          },
        });

        await touchRuntimeSession(session.id, {
          lastActiveAt: completedAt,
          lastRunAt: completedAt,
          lastError: null,
        });

        await appendRuntimeTranscriptEvent({
          sessionId: session.id,
          runId: run.id,
          role: "assistant",
          type: "agent_output",
          content: outputSummary,
          createdAt: completedAt,
          metadata: {
            agentId: request.agentId,
            executionTimeMs: result.metadata.executionTimeMs,
            provider: baseBridge.provider,
          },
        });

        await appendRuntimeTranscriptEvent({
          sessionId: session.id,
          runId: run.id,
          role: "system",
          type: "run_status",
          content: `Run completed for ${request.agentId}.`,
          createdAt: completedAt,
          metadata: {
            agentId: request.agentId,
            provider: baseBridge.provider,
          },
        });

        return {
          ...result,
          metadata: {
            ...result.metadata,
            sessionId: session.id,
          },
        };
      } catch (error) {
        const completedAt = new Date().toISOString();
        const errorMessage = toErrorMessage(error);

        await updateRuntimeRunRecord(run.id, {
          status: "failed",
          completedAt,
          error: errorMessage,
        });

        await touchRuntimeSession(session.id, {
          lastActiveAt: completedAt,
          lastRunAt: completedAt,
          lastError: errorMessage,
        });

        await appendRuntimeTranscriptEvent({
          sessionId: session.id,
          runId: run.id,
          role: "system",
          type: "run_status",
          content: `Run failed for ${request.agentId}: ${errorMessage}`,
          createdAt: completedAt,
          metadata: {
            agentId: request.agentId,
            provider: baseBridge.provider,
          },
        });

        throw error;
      }
    },

    async invokeTool(request: {
      tool: string;
      args: Record<string, unknown>;
      sessionId?: string;
    }): Promise<ToolResult> {
      const result = await baseBridge.invokeTool(request);

      if (request.sessionId) {
        await appendRuntimeTranscriptEvent({
          sessionId: request.sessionId,
          role: result.success ? "assistant" : "system",
          type: "tool_result",
          content: result.success
            ? `${request.tool}: ${summarizePayload(result.output)}`
            : `${request.tool}: ${result.error ?? "Tool invocation failed."}`,
          metadata: {
            tool: request.tool,
            success: result.success,
          },
        });
      }

      return result;
    },

    async submitJob(request) {
      return baseBridge.submitJob(request);
    },

    async getJobStatus(jobId) {
      return baseBridge.getJobStatus(jobId);
    },
  };

  return bridge;
}

function resolveOrigin(value: unknown): RuntimeSessionOrigin {
  if (typeof value !== "object" || value === null) {
    return "system";
  }

  const metadata = value as {
    origin?: unknown;
    metadata?: {
      origin?: unknown;
    };
  };
  const candidate = metadata.origin ?? metadata.metadata?.origin;

  if (candidate === "slack" || candidate === "web" || candidate === "api") {
    return candidate;
  }

  return "system";
}

function summarizePayload(value: unknown, maxLength = 280): string {
  if (typeof value === "string") {
    return truncate(value, maxLength);
  }

  try {
    return truncate(JSON.stringify(value), maxLength);
  } catch {
    return truncate(String(value), maxLength);
  }
}

function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) {
    return value;
  }

  return `${value.slice(0, maxLength - 3)}...`;
}

function buildFallbackSessionLabel(agentId: string): string {
  return `Authrix ${agentId.charAt(0).toUpperCase()}${agentId.slice(1)} Session`;
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown runtime error.";
}
