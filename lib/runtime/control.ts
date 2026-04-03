import { mkdir, readFile, writeFile } from "node:fs/promises";
import { AUTHRIX_DATA_DIR, resolveAuthrixDataPath } from "@/lib/security/paths";
import { getRuntimeBridge, resetRuntimeBridge } from "@/lib/runtime/bridge";
import type {
  RuntimeControlEvent,
  RuntimeControlEventStatus,
  RuntimeControlEventType,
  RuntimeStatus,
} from "@/types/runtime";

const RUNTIME_CONTROL_PATH = resolveAuthrixDataPath("runtime-control.json");

interface PersistedRuntimeControlState {
  updatedAt: string;
  events: RuntimeControlEvent[];
}

let cache: PersistedRuntimeControlState | null = null;
let cachePromise: Promise<PersistedRuntimeControlState> | null = null;

export async function listRuntimeControlEvents(
  limit = 10
): Promise<RuntimeControlEvent[]> {
  const state = await loadRuntimeControlState();
  return state.events
    .slice(0, limit)
    .map((event) => cloneRuntimeControlEvent(event));
}

export async function resetRuntimeAdapter(): Promise<{
  event: RuntimeControlEvent;
  status: RuntimeStatus;
}> {
  resetRuntimeBridge();
  const status = await getRuntimeBridge().getStatus();
  const event = await recordRuntimeControlEvent({
    type: "bridge_reset",
    status: status.mode === "disconnected" ? "failed" : "succeeded",
    message: buildResetMessage(status),
    metadata: {
      provider: status.provider,
      mode: status.mode,
      healthy: status.healthy,
      description: status.description,
    },
  });

  return { event, status };
}

async function recordRuntimeControlEvent(input: {
  type: RuntimeControlEventType;
  status: RuntimeControlEventStatus;
  message: string;
  metadata?: Record<string, unknown>;
}): Promise<RuntimeControlEvent> {
  const state = await loadRuntimeControlState();
  const event: RuntimeControlEvent = {
    id: `runtime_control_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    type: input.type,
    status: input.status,
    createdAt: new Date().toISOString(),
    message: input.message,
    metadata: { ...(input.metadata ?? {}) },
  };

  state.events.unshift(event);
  state.events = state.events.slice(0, 50);
  await saveRuntimeControlState(state);
  return cloneRuntimeControlEvent(event);
}

async function loadRuntimeControlState(): Promise<PersistedRuntimeControlState> {
  if (cache) {
    return cloneRuntimeControlState(cache);
  }

  if (!cachePromise) {
    cachePromise = readRuntimeControlStateFromDisk()
      .then((state) => {
        cache = state;
        return state;
      })
      .finally(() => {
        cachePromise = null;
      });
  }

  const state = await cachePromise;
  return cloneRuntimeControlState(state);
}

async function saveRuntimeControlState(
  state: PersistedRuntimeControlState
): Promise<void> {
  const nextState: PersistedRuntimeControlState = {
    updatedAt: new Date().toISOString(),
    events: state.events.map((event) => cloneRuntimeControlEvent(event)),
  };

  await mkdir(AUTHRIX_DATA_DIR, { recursive: true });
  await writeFile(RUNTIME_CONTROL_PATH, JSON.stringify(nextState, null, 2), "utf8");
  cache = nextState;
}

async function readRuntimeControlStateFromDisk(): Promise<PersistedRuntimeControlState> {
  try {
    const raw = await readFile(RUNTIME_CONTROL_PATH, "utf8");
    return migrateRuntimeControlState(
      JSON.parse(raw) as Partial<PersistedRuntimeControlState>
    );
  } catch (error) {
    if (isMissingFileError(error)) {
      return createEmptyRuntimeControlState();
    }

    throw error;
  }
}

function migrateRuntimeControlState(
  state: Partial<PersistedRuntimeControlState>
): PersistedRuntimeControlState {
  return {
    updatedAt: state.updatedAt ?? new Date().toISOString(),
    events: (state.events ?? []).map((event) => ({
      ...event,
      metadata: { ...(event.metadata ?? {}) },
    })),
  };
}

function createEmptyRuntimeControlState(): PersistedRuntimeControlState {
  return {
    updatedAt: new Date().toISOString(),
    events: [],
  };
}

function cloneRuntimeControlState(
  state: PersistedRuntimeControlState
): PersistedRuntimeControlState {
  return {
    updatedAt: state.updatedAt,
    events: state.events.map((event) => cloneRuntimeControlEvent(event)),
  };
}

function cloneRuntimeControlEvent(event: RuntimeControlEvent): RuntimeControlEvent {
  return {
    ...event,
    metadata: { ...event.metadata },
  };
}

function buildResetMessage(status: RuntimeStatus): string {
  if (status.mode === "live") {
    return "Authrix reset its runtime adapter and reconnected to the live runtime.";
  }

  if (status.mode === "mock") {
    return "Authrix reset its runtime adapter and is back in mock runtime mode.";
  }

  return "Authrix reset its runtime adapter, but the runtime is still disconnected.";
}

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ENOENT"
  );
}
