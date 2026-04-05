import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolveAuthrixDataPath } from "@/lib/security/paths";
import type { WorkflowFollowUpRecord } from "@/types/workflow";

const WORKFLOW_STATE_PATH = resolveAuthrixDataPath("workflow-state.json");

interface PersistedWorkflowState {
  updatedAt: string;
  followUps: WorkflowFollowUpRecord[];
}

let cache: PersistedWorkflowState | null = null;
let cachePromise: Promise<PersistedWorkflowState> | null = null;

export async function listWorkflowFollowUpRecords(
  limit = 25
): Promise<WorkflowFollowUpRecord[]> {
  const state = await loadWorkflowState();
  return state.followUps.slice(0, limit).map(cloneFollowUpRecord);
}

export async function replaceWorkflowFollowUpRecords(
  records: WorkflowFollowUpRecord[]
): Promise<void> {
  const state = await loadWorkflowState();
  state.followUps = records.map(cloneFollowUpRecord);
  await saveWorkflowState(state);
}

async function loadWorkflowState(): Promise<PersistedWorkflowState> {
  if (cache) {
    return cloneWorkflowState(cache);
  }

  if (!cachePromise) {
    cachePromise = readWorkflowStateFromDisk()
      .then((state) => {
        cache = state;
        return state;
      })
      .finally(() => {
        cachePromise = null;
      });
  }

  const state = await cachePromise;
  return cloneWorkflowState(state);
}

async function saveWorkflowState(state: PersistedWorkflowState): Promise<void> {
  const nextState: PersistedWorkflowState = {
    updatedAt: new Date().toISOString(),
    followUps: state.followUps.map(cloneFollowUpRecord),
  };

  await mkdir(resolveAuthrixDataPath(), { recursive: true });
  await writeFile(WORKFLOW_STATE_PATH, JSON.stringify(nextState, null, 2), "utf8");
  cache = nextState;
}

async function readWorkflowStateFromDisk(): Promise<PersistedWorkflowState> {
  try {
    const raw = await readFile(WORKFLOW_STATE_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<PersistedWorkflowState>;
    return {
      updatedAt: parsed.updatedAt ?? new Date().toISOString(),
      followUps: (parsed.followUps ?? []).map(cloneFollowUpRecord),
    };
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "ENOENT"
    ) {
      return {
        updatedAt: new Date().toISOString(),
        followUps: [],
      };
    }

    throw error;
  }
}

function cloneWorkflowState(state: PersistedWorkflowState): PersistedWorkflowState {
  return {
    updatedAt: state.updatedAt,
    followUps: state.followUps.map(cloneFollowUpRecord),
  };
}

function cloneFollowUpRecord(record: WorkflowFollowUpRecord): WorkflowFollowUpRecord {
  return {
    ...record,
    metadata: { ...record.metadata },
  };
}
