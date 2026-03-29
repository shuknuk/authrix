import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { WorkspaceSnapshot } from "@/types/domain";

const DATA_DIR = path.join(process.cwd(), ".authrix-data");
const SNAPSHOT_PATH = path.join(DATA_DIR, "workspace-state.json");

let cache: WorkspaceSnapshot | null = null;
let cachePromise: Promise<WorkspaceSnapshot | null> | null = null;

export async function loadPersistedWorkspaceSnapshot(): Promise<WorkspaceSnapshot | null> {
  if (cache) {
    return structuredClone(cache);
  }

  if (!cachePromise) {
    cachePromise = readPersistedSnapshotFromDisk()
      .then((snapshot) => {
        cache = snapshot;
        return snapshot;
      })
      .finally(() => {
        cachePromise = null;
      });
  }

  const snapshot = await cachePromise;
  return snapshot ? structuredClone(snapshot) : null;
}

export async function saveWorkspaceSnapshot(
  snapshot: WorkspaceSnapshot
): Promise<WorkspaceSnapshot> {
  const persistedAt = new Date().toISOString();
  const nextSnapshot: WorkspaceSnapshot = {
    ...structuredClone(snapshot),
    state: {
      ...snapshot.state,
      storage: "filesystem",
      persistedAt,
    },
  };

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(SNAPSHOT_PATH, JSON.stringify(nextSnapshot, null, 2), "utf8");
  cache = nextSnapshot;

  return structuredClone(nextSnapshot);
}

export async function updatePersistedWorkspaceSnapshot(
  update: (snapshot: WorkspaceSnapshot) => WorkspaceSnapshot | Promise<WorkspaceSnapshot>
): Promise<WorkspaceSnapshot | null> {
  const current = await loadPersistedWorkspaceSnapshot();
  if (!current) {
    return null;
  }

  const nextSnapshot = await update(current);
  return saveWorkspaceSnapshot(nextSnapshot);
}

export function clearWorkspaceSnapshotCache(): void {
  cache = null;
  cachePromise = null;
}

async function readPersistedSnapshotFromDisk(): Promise<WorkspaceSnapshot | null> {
  try {
    const raw = await readFile(SNAPSHOT_PATH, "utf8");
    return JSON.parse(raw) as WorkspaceSnapshot;
  } catch (error) {
    if (isMissingFileError(error)) {
      return null;
    }

    throw error;
  }
}

function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: string }).code === "ENOENT"
  );
}
