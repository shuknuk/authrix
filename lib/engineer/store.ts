import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolveAuthrixDataPath } from "@/lib/security/paths";
import type { EngineerExecutionRecord } from "@/types/engineer";

// Check if we're in a serverless environment
const isServerlessEnvironment = process.env.VERCEL || process.env.NOW_REGION;

// In-memory fallback for serverless environments
let inMemoryEngineerState: PersistedEngineerState | null = null;

const ENGINEER_STATE_PATH = resolveAuthrixDataPath("engineer-state.json");

interface PersistedEngineerState {
  updatedAt: string;
  executions: EngineerExecutionRecord[];
}

let cache: PersistedEngineerState | null = null;
let cachePromise: Promise<PersistedEngineerState> | null = null;

export async function listEngineerExecutionRecords(
  limit = 25
): Promise<EngineerExecutionRecord[]> {
  const state = await loadEngineerState();
  return [...state.executions]
    .sort(
      (left, right) =>
        new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime()
    )
    .slice(0, limit)
    .map(cloneExecutionRecord)
    .filter(isEngineerExecutionRecord);
}

export async function getEngineerExecutionRecord(
  id: string
): Promise<EngineerExecutionRecord | null> {
  const state = await loadEngineerState();
  return cloneExecutionRecord(state.executions.find((execution) => execution.id === id) ?? null);
}

export async function createEngineerExecutionRecord(
  input: Omit<EngineerExecutionRecord, "updatedAt">
): Promise<EngineerExecutionRecord> {
  const state = await loadEngineerState();
  const record: EngineerExecutionRecord = {
    ...cloneExecutionRecord(input)!,
    updatedAt: input.createdAt,
  };

  state.executions.unshift(record);
  state.executions = state.executions.slice(0, 100);
  await saveEngineerState(state);
  return cloneExecutionRecord(record)!;
}

export async function updateEngineerExecutionRecord(
  id: string,
  patch: Partial<Omit<EngineerExecutionRecord, "id" | "sessionId" | "runId" | "createdAt">>
): Promise<EngineerExecutionRecord | null> {
  const state = await loadEngineerState();
  const index = state.executions.findIndex((execution) => execution.id === id);

  if (index === -1) {
    return null;
  }

  const existing = state.executions[index];
  const nextRecord: EngineerExecutionRecord = {
    ...existing,
    ...patch,
    plan: patch.plan ? [...patch.plan] : existing.plan,
    changedFiles: patch.changedFiles ? [...patch.changedFiles] : existing.changedFiles,
    checks: patch.checks
      ? patch.checks.map((check) => ({ ...check }))
      : existing.checks.map((check) => ({ ...check })),
    metadata: patch.metadata
      ? {
          ...existing.metadata,
          ...patch.metadata,
        }
      : { ...existing.metadata },
    updatedAt: new Date().toISOString(),
  };

  state.executions[index] = nextRecord;
  await saveEngineerState(state);
  return cloneExecutionRecord(nextRecord)!;
}

async function loadEngineerState(): Promise<PersistedEngineerState> {
  if (cache) {
    return cloneEngineerState(cache);
  }

  if (!cachePromise) {
    cachePromise = readEngineerStateFromDisk()
      .then((state) => {
        cache = state;
        return state;
      })
      .finally(() => {
        cachePromise = null;
      });
  }

  const state = await cachePromise;
  return cloneEngineerState(state);
}

async function saveEngineerState(state: PersistedEngineerState): Promise<void> {
  const nextState: PersistedEngineerState = {
    ...cloneEngineerState(state),
    updatedAt: new Date().toISOString(),
  };

  // In serverless environments, use in-memory storage
  if (isServerlessEnvironment) {
    cache = nextState;
    inMemoryEngineerState = nextState;
    return;
  }

  try {
    await mkdir(resolveAuthrixDataPath(), { recursive: true });
    await writeFile(ENGINEER_STATE_PATH, JSON.stringify(nextState, null, 2), "utf8");
    cache = nextState;
  } catch (error) {
    // Even if file system write fails, store in memory if we're in serverless environment
    if (isServerlessEnvironment) {
      cache = nextState;
      inMemoryEngineerState = nextState;
      return;
    }
    throw error;
  }
}

async function readEngineerStateFromDisk(): Promise<PersistedEngineerState> {
  // In serverless environments, try to use in-memory state first
  if (isServerlessEnvironment && inMemoryEngineerState) {
    return inMemoryEngineerState;
  } else if (isServerlessEnvironment) {
    const state = {
      updatedAt: new Date().toISOString(),
      executions: [],
    };
    inMemoryEngineerState = state;
    return state;
  }

  try {
    const raw = await readFile(ENGINEER_STATE_PATH, "utf8");
    return migrateEngineerState(JSON.parse(raw) as Partial<PersistedEngineerState>);
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "ENOENT"
    ) {
      return {
        updatedAt: new Date().toISOString(),
        executions: [],
      };
    }

    throw error;
  }
}

function migrateEngineerState(
  state: Partial<PersistedEngineerState>
): PersistedEngineerState {
  return {
    updatedAt: state.updatedAt ?? new Date().toISOString(),
    executions: (state.executions ?? []).map((execution) => cloneExecutionRecord(execution)!),
  };
}

function cloneEngineerState(state: PersistedEngineerState): PersistedEngineerState {
  return {
    updatedAt: state.updatedAt,
    executions: state.executions.map((execution) => cloneExecutionRecord(execution)!),
  };
}

function cloneExecutionRecord(
  record: EngineerExecutionRecord | Omit<EngineerExecutionRecord, "updatedAt"> | null
): EngineerExecutionRecord | null {
  if (!record) {
    return null;
  }

  return {
    ...record,
    updatedAt: "updatedAt" in record ? record.updatedAt : record.createdAt,
    plan: [...record.plan],
    changedFiles: [...record.changedFiles],
    checks: record.checks.map((check) => ({ ...check })),
    metadata: { ...record.metadata },
  };
}

function isEngineerExecutionRecord(
  record: EngineerExecutionRecord | null
): record is EngineerExecutionRecord {
  return record !== null;
}
