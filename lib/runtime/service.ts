import { getBaseRuntimeBridge, getRuntimeBridge } from "@/lib/runtime/bridge";
import {
  appendRuntimeTranscriptEvent,
  createRuntimeRunRecord,
  getRuntimeRunRecord,
  getRuntimeSessionRecord,
  getRuntimeTranscript,
  listRuntimeRuns,
  listRuntimeSessions,
  touchRuntimeSession,
  updateRuntimeRunRecord,
} from "@/lib/runtime/store";
import type {
  RuntimeRunRecord,
  RuntimeSessionOrigin,
  RuntimeSessionRecord,
  RuntimeTranscriptEvent,
} from "@/types/runtime";

export interface RuntimeSessionDetails {
  session: RuntimeSessionRecord;
  runs: RuntimeRunRecord[];
  transcript: RuntimeTranscriptEvent[];
}

export interface RuntimeRunDetails {
  run: RuntimeRunRecord;
  session: RuntimeSessionRecord | null;
}

export async function createRuntimeSession(input: {
  agentId: string;
  label?: string;
  model?: string;
  origin?: RuntimeSessionOrigin;
  metadata?: Record<string, unknown>;
}): Promise<RuntimeSessionRecord> {
  const session = await getRuntimeBridge().createSession({
    agentId: input.agentId,
    label: input.label ?? buildFallbackSessionLabel(input.agentId),
    model: input.model,
    metadata: {
      ...(input.metadata ?? {}),
      origin: input.origin ?? "api",
    },
  });

  const persisted = await getRuntimeSessionRecord(session.id);
  if (!persisted) {
    throw new Error("Authrix created a runtime session but could not persist it.");
  }

  return persisted;
}

export async function listAuthrixRuntimeSessions(
  limit = 12
): Promise<RuntimeSessionRecord[]> {
  return listRuntimeSessions(limit);
}

export async function listAuthrixRuntimeRuns(limit = 12): Promise<RuntimeRunRecord[]> {
  return listRuntimeRuns(limit);
}

export async function getRuntimeSessionDetails(
  sessionId: string,
  transcriptLimit = 100
): Promise<RuntimeSessionDetails | null> {
  const session = await getRuntimeSessionRecord(sessionId);
  if (!session) {
    return null;
  }

  const [runs, transcript] = await Promise.all([
    listRuntimeRuns(200),
    getRuntimeTranscript(sessionId, transcriptLimit),
  ]);

  return {
    session,
    runs: runs.filter((run) => run.sessionId === sessionId),
    transcript,
  };
}

export async function getRuntimeRunDetails(
  runId: string
): Promise<RuntimeRunDetails | null> {
  const run = await getRuntimeRunRecord(runId);
  if (!run) {
    return null;
  }

  const session = await getRuntimeSessionRecord(run.sessionId);
  return {
    run,
    session,
  };
}

export async function queueRuntimeAgentRun(input: {
  agentId: string;
  payload: unknown;
  sessionId?: string;
  tools?: string[];
  origin?: RuntimeSessionOrigin;
  label?: string;
  model?: string;
  metadata?: Record<string, unknown>;
}): Promise<RuntimeRunRecord> {
  const runtimeBridge = getRuntimeBridge();
  const baseBridge = getBaseRuntimeBridge();
  const session =
    input.sessionId !== undefined
      ? await runtimeBridge.getSession(input.sessionId)
      : await runtimeBridge.createSession({
          agentId: input.agentId,
          label: input.label ?? buildFallbackSessionLabel(input.agentId),
          model: input.model,
          metadata: {
            ...(input.metadata ?? {}),
            origin: input.origin ?? "api",
          },
        });

  if (!session) {
    throw new Error("Authrix could not resolve a runtime session for this queued run.");
  }

  const sessionRecord = await getRuntimeSessionRecord(session.id);
  const origin = input.origin ?? sessionRecord?.origin ?? "api";
  const run = await createRuntimeRunRecord({
    sessionId: session.id,
    agentId: input.agentId,
    provider: baseBridge.provider,
    origin,
    inputSummary: summarizePayload(input.payload),
    status: "queued",
    tools: input.tools,
    metadata: {
      ...(input.metadata ?? {}),
      requestedTools: input.tools ?? [],
      queuedBy: "runtime-service",
    },
  });

  await appendRuntimeTranscriptEvent({
    sessionId: session.id,
    runId: run.id,
    role: "system",
    type: "run_status",
    content: `Run queued for ${input.agentId}.`,
    metadata: {
      agentId: input.agentId,
      provider: baseBridge.provider,
    },
  });

  await appendRuntimeTranscriptEvent({
    sessionId: session.id,
    runId: run.id,
    role: "user",
    type: "agent_input",
    content: summarizePayload(input.payload, 800),
    metadata: {
      agentId: input.agentId,
      origin,
      requestedTools: input.tools ?? [],
    },
  });

  void executeQueuedRuntimeAgentRun({
    runId: run.id,
    sessionId: session.id,
    agentId: input.agentId,
    payload: input.payload,
    tools: input.tools,
  });

  return run;
}

async function executeQueuedRuntimeAgentRun(input: {
  runId: string;
  sessionId: string;
  agentId: string;
  payload: unknown;
  tools?: string[];
}): Promise<void> {
  const bridge = getBaseRuntimeBridge();
  const startedAt = new Date().toISOString();

  await updateRuntimeRunRecord(input.runId, {
    status: "running",
    startedAt,
  });

  await touchRuntimeSession(input.sessionId, {
    lastActiveAt: startedAt,
  });

  await appendRuntimeTranscriptEvent({
    sessionId: input.sessionId,
    runId: input.runId,
    role: "system",
    type: "run_status",
    content: `Run started for ${input.agentId}.`,
    createdAt: startedAt,
    metadata: {
      agentId: input.agentId,
      provider: bridge.provider,
    },
  });

  try {
    const result = await bridge.executeAgent({
      agentId: input.agentId,
      input: input.payload,
      tools: input.tools,
      sessionId: input.sessionId,
    });
    const completedAt = result.metadata.timestamp ?? new Date().toISOString();
    const outputSummary = summarizePayload(result.output, 800);

    await updateRuntimeRunRecord(input.runId, {
      status: "completed",
      completedAt,
      outputSummary,
      metadata: {
        executionTimeMs: result.metadata.executionTimeMs,
        allowedTools: result.metadata.allowedTools ?? [],
        blockedTools: result.metadata.blockedTools ?? [],
      },
    });

    await touchRuntimeSession(input.sessionId, {
      lastActiveAt: completedAt,
      lastRunAt: completedAt,
      lastError: null,
    });

    await appendRuntimeTranscriptEvent({
      sessionId: input.sessionId,
      runId: input.runId,
      role: "assistant",
      type: "agent_output",
      content: outputSummary,
      createdAt: completedAt,
      metadata: {
        agentId: input.agentId,
        provider: bridge.provider,
        executionTimeMs: result.metadata.executionTimeMs,
      },
    });

    await appendRuntimeTranscriptEvent({
      sessionId: input.sessionId,
      runId: input.runId,
      role: "system",
      type: "run_status",
      content: `Run completed for ${input.agentId}.`,
      createdAt: completedAt,
      metadata: {
        agentId: input.agentId,
        provider: bridge.provider,
      },
    });
  } catch (error) {
    const completedAt = new Date().toISOString();
    const errorMessage = toErrorMessage(error);

    await updateRuntimeRunRecord(input.runId, {
      status: "failed",
      completedAt,
      error: errorMessage,
    });

    await touchRuntimeSession(input.sessionId, {
      lastActiveAt: completedAt,
      lastRunAt: completedAt,
      lastError: errorMessage,
    });

    await appendRuntimeTranscriptEvent({
      sessionId: input.sessionId,
      runId: input.runId,
      role: "system",
      type: "run_status",
      content: `Run failed for ${input.agentId}: ${errorMessage}`,
      createdAt: completedAt,
      metadata: {
        agentId: input.agentId,
        provider: bridge.provider,
      },
    });
  }
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
