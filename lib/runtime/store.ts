import { appendFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { AUTHRIX_DATA_DIR, resolveAuthrixDataPath } from "@/lib/security/paths";
import type {
  JobState,
  RuntimeRunRecord,
  RuntimeSessionOrigin,
  RuntimeSessionRecord,
  RuntimeTranscriptEvent,
  Session,
} from "@/types/runtime";

const WORKSPACE_ID = "workspace-authrix";
const RUNTIME_STATE_PATH = resolveAuthrixDataPath("runtime-state.json");
const RUNTIME_TRANSCRIPTS_DIR = resolveAuthrixDataPath("runtime-sessions");

interface PersistedRuntimeState {
  updatedAt: string;
  sessions: RuntimeSessionRecord[];
  runs: RuntimeRunRecord[];
}

let cache: PersistedRuntimeState | null = null;
let cachePromise: Promise<PersistedRuntimeState> | null = null;

export async function listRuntimeSessions(limit = 25): Promise<RuntimeSessionRecord[]> {
  const state = await loadRuntimeState();
  return [...state.sessions]
    .sort(
      (left, right) =>
        new Date(right.lastActiveAt).getTime() - new Date(left.lastActiveAt).getTime()
    )
    .slice(0, limit)
    .map((session) => cloneSessionRecord(session) as RuntimeSessionRecord);
}

export async function getRuntimeSessionRecord(
  sessionId: string
): Promise<RuntimeSessionRecord | null> {
  const state = await loadRuntimeState();
  return cloneSessionRecord(
    state.sessions.find((session) => session.id === sessionId) ?? null
  );
}

export async function ensureRuntimeSessionRecord(input: {
  session: Session;
  origin?: RuntimeSessionOrigin;
  workspaceId?: string;
}): Promise<RuntimeSessionRecord> {
  const state = await loadRuntimeState();
  const existingIndex = state.sessions.findIndex(
    (session) => session.id === input.session.id
  );
  const origin = input.origin ?? readRuntimeSessionOrigin(input.session.metadata);
  const nextRecord: RuntimeSessionRecord =
    existingIndex >= 0
      ? {
          ...state.sessions[existingIndex],
          label: input.session.label ?? state.sessions[existingIndex].label,
          lastActiveAt: input.session.lastActiveAt,
          metadata: {
            ...state.sessions[existingIndex].metadata,
            ...input.session.metadata,
            origin,
          },
          origin,
        }
      : {
          ...cloneSession(input.session),
          workspaceId: input.workspaceId ?? WORKSPACE_ID,
          origin,
          state: "active",
          runCount: 0,
          messageCount: 0,
          metadata: {
            ...input.session.metadata,
            origin,
          },
        };

  if (existingIndex >= 0) {
    state.sessions[existingIndex] = nextRecord;
  } else {
    state.sessions.unshift(nextRecord);
  }

  await saveRuntimeState(state);
  return cloneSessionRecord(nextRecord)!;
}

export async function touchRuntimeSession(
  sessionId: string,
  patch: {
    lastActiveAt?: string;
    lastRunAt?: string;
    lastError?: string | null;
    state?: RuntimeSessionRecord["state"];
    messageCountDelta?: number;
    runCountDelta?: number;
    metadata?: Record<string, unknown>;
  }
): Promise<RuntimeSessionRecord | null> {
  const state = await loadRuntimeState();
  const sessionIndex = state.sessions.findIndex((session) => session.id === sessionId);

  if (sessionIndex === -1) {
    return null;
  }

  const existing = state.sessions[sessionIndex];
  const nextRecord: RuntimeSessionRecord = {
    ...existing,
    lastActiveAt: patch.lastActiveAt ?? existing.lastActiveAt,
    lastRunAt: patch.lastRunAt ?? existing.lastRunAt,
    state: patch.state ?? existing.state,
    runCount: Math.max(0, existing.runCount + (patch.runCountDelta ?? 0)),
    messageCount: Math.max(0, existing.messageCount + (patch.messageCountDelta ?? 0)),
    metadata: patch.metadata
      ? {
          ...existing.metadata,
          ...patch.metadata,
        }
      : existing.metadata,
  };

  if (patch.lastError !== undefined) {
    nextRecord.lastError = patch.lastError ?? undefined;
  }

  state.sessions[sessionIndex] = nextRecord;
  await saveRuntimeState(state);
  return cloneSessionRecord(nextRecord)!;
}

export async function listRuntimeRuns(limit = 25): Promise<RuntimeRunRecord[]> {
  const state = await loadRuntimeState();
  return [...state.runs]
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
    )
    .slice(0, limit)
    .map((run) => cloneRunRecord(run) as RuntimeRunRecord);
}

export async function getRuntimeRunRecord(
  runId: string
): Promise<RuntimeRunRecord | null> {
  const state = await loadRuntimeState();
  return cloneRunRecord(state.runs.find((run) => run.id === runId) ?? null);
}

export async function createRuntimeRunRecord(input: {
  sessionId: string;
  agentId: string;
  provider: RuntimeRunRecord["provider"];
  origin: RuntimeSessionOrigin;
  inputSummary: string;
  status?: JobState;
  tools?: string[];
  metadata?: Record<string, unknown>;
}): Promise<RuntimeRunRecord> {
  const createdAt = new Date().toISOString();
  const record: RuntimeRunRecord = {
    id: `runtime_run_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    sessionId: input.sessionId,
    agentId: input.agentId,
    provider: input.provider,
    origin: input.origin,
    status: input.status ?? "queued",
    createdAt,
    inputSummary: input.inputSummary,
    tools: [...(input.tools ?? [])],
    metadata: { ...(input.metadata ?? {}) },
  };

  const state = await loadRuntimeState();
  state.runs.unshift(record);
  state.runs = state.runs.slice(0, 200);
  const sessionIndex = state.sessions.findIndex(
    (session) => session.id === input.sessionId
  );
  if (sessionIndex >= 0) {
    state.sessions[sessionIndex] = {
      ...state.sessions[sessionIndex],
      runCount: state.sessions[sessionIndex].runCount + 1,
      lastRunAt: createdAt,
      lastActiveAt: createdAt,
      lastError: undefined,
    };
  }

  await saveRuntimeState(state);
  return cloneRunRecord(record)!;
}

export async function updateRuntimeRunRecord(
  runId: string,
  patch: Partial<Omit<RuntimeRunRecord, "id" | "sessionId" | "agentId" | "createdAt">>
): Promise<RuntimeRunRecord | null> {
  const state = await loadRuntimeState();
  const runIndex = state.runs.findIndex((run) => run.id === runId);

  if (runIndex === -1) {
    return null;
  }

  const existing = state.runs[runIndex];
  const nextRecord: RuntimeRunRecord = {
    ...existing,
    ...patch,
    tools: patch.tools ? [...patch.tools] : existing.tools,
    metadata: patch.metadata
      ? {
          ...existing.metadata,
          ...patch.metadata,
        }
      : existing.metadata,
  };

  state.runs[runIndex] = nextRecord;

  const sessionIndex = state.sessions.findIndex(
    (session) => session.id === existing.sessionId
  );
  if (sessionIndex >= 0) {
    const lastActiveAt =
      nextRecord.completedAt ?? nextRecord.startedAt ?? existing.createdAt;

    state.sessions[sessionIndex] = {
      ...state.sessions[sessionIndex],
      lastActiveAt,
      lastRunAt: lastActiveAt,
      lastError:
        nextRecord.status === "failed"
          ? nextRecord.error ?? state.sessions[sessionIndex].lastError
          : undefined,
    };
  }

  await saveRuntimeState(state);
  return cloneRunRecord(nextRecord)!;
}

export async function appendRuntimeTranscriptEvent(input: {
  sessionId: string;
  runId?: string;
  role: RuntimeTranscriptEvent["role"];
  type: RuntimeTranscriptEvent["type"];
  content: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}): Promise<RuntimeTranscriptEvent> {
  const createdAt = input.createdAt ?? new Date().toISOString();
  const event: RuntimeTranscriptEvent = {
    id: `runtime_event_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    sessionId: input.sessionId,
    runId: input.runId,
    role: input.role,
    type: input.type,
    content: input.content,
    createdAt,
    metadata: { ...(input.metadata ?? {}) },
  };

  const transcriptPath = getRuntimeTranscriptPath(input.sessionId);
  await mkdir(path.dirname(transcriptPath), { recursive: true });
  await appendFile(transcriptPath, `${JSON.stringify(event)}\n`, "utf8");

  await touchRuntimeSession(input.sessionId, {
    lastActiveAt: createdAt,
    messageCountDelta:
      input.role === "user" || input.role === "assistant" ? 1 : 0,
  });

  return cloneTranscriptEvent(event);
}

export async function getRuntimeTranscript(
  sessionId: string,
  limit = 100
): Promise<RuntimeTranscriptEvent[]> {
  const transcriptPath = getRuntimeTranscriptPath(sessionId);

  try {
    const raw = await readFile(transcriptPath, "utf8");
    const events = raw
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => JSON.parse(line) as RuntimeTranscriptEvent);

    return events.slice(-limit).map(cloneTranscriptEvent);
  } catch (error) {
    if (isMissingFileError(error)) {
      return [];
    }

    throw error;
  }
}

function getRuntimeTranscriptPath(sessionId: string): string {
  return resolveAuthrixDataPath("runtime-sessions", `${sessionId}.jsonl`);
}

async function loadRuntimeState(): Promise<PersistedRuntimeState> {
  if (cache) {
    return cloneRuntimeState(cache);
  }

  if (!cachePromise) {
    cachePromise = readRuntimeStateFromDisk()
      .then((state) => {
        cache = state;
        return state;
      })
      .finally(() => {
        cachePromise = null;
      });
  }

  const state = await cachePromise;
  return cloneRuntimeState(state);
}

async function saveRuntimeState(state: PersistedRuntimeState): Promise<void> {
  const nextState: PersistedRuntimeState = {
    ...cloneRuntimeState(state),
    updatedAt: new Date().toISOString(),
  };

  await mkdir(AUTHRIX_DATA_DIR, { recursive: true });
  await mkdir(RUNTIME_TRANSCRIPTS_DIR, { recursive: true });
  await writeFile(RUNTIME_STATE_PATH, JSON.stringify(nextState, null, 2), "utf8");
  cache = nextState;
}

async function readRuntimeStateFromDisk(): Promise<PersistedRuntimeState> {
  try {
    const raw = await readFile(RUNTIME_STATE_PATH, "utf8");
    return migrateRuntimeState(JSON.parse(raw) as Partial<PersistedRuntimeState>);
  } catch (error) {
    if (isMissingFileError(error)) {
      return createEmptyRuntimeState();
    }

    throw error;
  }
}

function migrateRuntimeState(
  state: Partial<PersistedRuntimeState>
): PersistedRuntimeState {
  return {
    updatedAt: state.updatedAt ?? new Date().toISOString(),
    sessions: (state.sessions ?? []).map((session) => ({
      ...session,
      workspaceId: session.workspaceId ?? WORKSPACE_ID,
      origin: session.origin ?? readRuntimeSessionOrigin(session.metadata),
      state: session.state ?? "active",
      runCount: session.runCount ?? 0,
      messageCount: session.messageCount ?? 0,
      metadata: { ...(session.metadata ?? {}) },
    })),
    runs: (state.runs ?? []).map((run) => ({
      ...run,
      origin: run.origin ?? "system",
      tools: [...(run.tools ?? [])],
      metadata: { ...(run.metadata ?? {}) },
    })),
  };
}

function createEmptyRuntimeState(): PersistedRuntimeState {
  return {
    updatedAt: new Date().toISOString(),
    sessions: [],
    runs: [],
  };
}

function readRuntimeSessionOrigin(
  metadata: Record<string, unknown> | undefined
): RuntimeSessionOrigin {
  const origin = metadata?.origin;
  return origin === "slack" || origin === "web" || origin === "api"
    ? origin
    : "system";
}

function cloneRuntimeState(state: PersistedRuntimeState): PersistedRuntimeState {
  return {
    updatedAt: state.updatedAt,
    sessions: state.sessions.map(
      (session) => cloneSessionRecord(session) as RuntimeSessionRecord
    ),
    runs: state.runs.map((run) => cloneRunRecord(run) as RuntimeRunRecord),
  };
}

function cloneSession(input: Session): Session {
  return {
    ...input,
    metadata: { ...input.metadata },
  };
}

function cloneSessionRecord(
  record: RuntimeSessionRecord | null
): RuntimeSessionRecord | null {
  if (!record) {
    return null;
  }

  return {
    ...record,
    metadata: { ...record.metadata },
  };
}

function cloneRunRecord(record: RuntimeRunRecord | null): RuntimeRunRecord | null {
  if (!record) {
    return null;
  }

  return {
    ...record,
    tools: [...record.tools],
    metadata: { ...record.metadata },
  };
}

function cloneTranscriptEvent(event: RuntimeTranscriptEvent): RuntimeTranscriptEvent {
  return {
    ...event,
    metadata: { ...event.metadata },
  };
}

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ENOENT"
  );
}
