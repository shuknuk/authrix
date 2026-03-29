import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolveAuthrixDataPath } from "@/lib/security/paths";
import type { SecurityEvent } from "@/types/security";

const SECURITY_EVENTS_PATH = resolveAuthrixDataPath("security-events.json");

let cache: SecurityEvent[] | null = null;
let cachePromise: Promise<SecurityEvent[]> | null = null;

export async function listSecurityEvents(limit = 25): Promise<SecurityEvent[]> {
  const events = await loadSecurityEvents();
  return events.slice(0, limit).map(cloneSecurityEvent);
}

export async function recordSecurityEvent(
  input: Omit<SecurityEvent, "id" | "timestamp"> & {
    id?: string;
    timestamp?: string;
  }
): Promise<SecurityEvent> {
  const timestamp = input.timestamp ?? new Date().toISOString();
  const event: SecurityEvent = {
    id: input.id ?? `security-event-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    timestamp,
    level: input.level,
    category: input.category,
    title: input.title,
    description: input.description,
    metadata: { ...input.metadata },
  };

  const existing = await loadSecurityEvents();
  const next = [event, ...existing].slice(0, 100);
  await saveSecurityEvents(next);
  return cloneSecurityEvent(event);
}

async function loadSecurityEvents(): Promise<SecurityEvent[]> {
  if (cache) {
    return cache.map(cloneSecurityEvent);
  }

  if (!cachePromise) {
    cachePromise = readSecurityEventsFromDisk()
      .then((events) => {
        cache = events;
        return events;
      })
      .finally(() => {
        cachePromise = null;
      });
  }

  const events = await cachePromise;
  return events.map(cloneSecurityEvent);
}

async function saveSecurityEvents(events: SecurityEvent[]): Promise<void> {
  await mkdir(resolveAuthrixDataPath(), { recursive: true });
  await writeFile(SECURITY_EVENTS_PATH, JSON.stringify(events, null, 2), "utf8");
  cache = events.map(cloneSecurityEvent);
}

async function readSecurityEventsFromDisk(): Promise<SecurityEvent[]> {
  try {
    const raw = await readFile(SECURITY_EVENTS_PATH, "utf8");
    return JSON.parse(raw) as SecurityEvent[];
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "ENOENT"
    ) {
      return [];
    }

    throw error;
  }
}

function cloneSecurityEvent(event: SecurityEvent): SecurityEvent {
  return {
    ...event,
    metadata: { ...event.metadata },
  };
}
