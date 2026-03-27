import "server-only";
import type { ApprovalQueueItem } from "@/types/authrix";

const globalApprovalStore = globalThis as typeof globalThis & {
  __authrixApprovalQueue?: ApprovalQueueItem[];
};

function seedQueue(): ApprovalQueueItem[] {
  return [
    {
      id: "seed-1",
      action: "Review weekly summary draft",
      status: "approved",
      requestedAt: "2026-03-26T14:35:00.000Z",
      actor: "Founding PM",
      summary: "Approved the summary refresh that powers the dashboard hero.",
    },
    {
      id: "seed-2",
      action: "Create follow-up tasks",
      status: "pending",
      requestedAt: "2026-03-26T15:10:00.000Z",
      actor: "Engineering lead",
      summary: "Waiting on explicit approval before turning the weekly summary into task objects.",
    },
  ];
}

function getStore() {
  if (!globalApprovalStore.__authrixApprovalQueue) {
    globalApprovalStore.__authrixApprovalQueue = seedQueue();
  }

  return globalApprovalStore.__authrixApprovalQueue;
}

export function listApprovalQueue() {
  return [...getStore()].sort((left, right) =>
    left.requestedAt < right.requestedAt ? 1 : -1,
  );
}

export function recordExecution(action: string, actor: string, summary: string) {
  const item: ApprovalQueueItem = {
    id: `approval-${Date.now()}`,
    action,
    status: "executed",
    requestedAt: new Date().toISOString(),
    actor,
    summary,
  };

  getStore().unshift(item);
  return item;
}
