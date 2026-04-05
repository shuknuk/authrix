import { replaceWorkflowFollowUpRecords } from "@/lib/workflow/store";
import type { SuggestedTask, WorkspaceSnapshot } from "@/types/domain";
import type { WorkflowFollowUpRecord } from "@/types/workflow";

const DUE_SOON_WINDOW_MS = 1000 * 60 * 60 * 24;

export async function syncWorkflowFollowUpRecords(snapshot: WorkspaceSnapshot): Promise<{
  reminders: WorkflowFollowUpRecord[];
  openCount: number;
  overdueCount: number;
}> {
  const reminders = buildWorkflowFollowUpRecords(snapshot);
  await replaceWorkflowFollowUpRecords(reminders);

  return {
    reminders,
    openCount: reminders.length,
    overdueCount: reminders.filter((record) => record.kind === "overdue").length,
  };
}

function buildWorkflowFollowUpRecords(
  snapshot: WorkspaceSnapshot
): WorkflowFollowUpRecord[] {
  const now = Date.now();
  const records: WorkflowFollowUpRecord[] = [];
  const tasks = snapshot.tasks.filter((task) => task.status !== "completed" && task.status !== "rejected");

  for (const task of tasks) {
    if (!task.suggestedOwner) {
      records.push(createFollowUpRecord(task, "missing_owner", {
        severity: task.priority === "high" || task.priority === "critical" ? "high" : "medium",
        message: `${task.title} still needs a clear owner before Workflow can treat it as real follow-through.`,
      }));
    }

    const dueTime = task.dueDate ? new Date(task.dueDate).getTime() : null;
    if (dueTime && dueTime < now) {
      records.push(createFollowUpRecord(task, "overdue", {
        severity: "high",
        message: `${task.title} is overdue and needs follow-through or a replan.`,
      }));
    } else if (dueTime && dueTime - now <= DUE_SOON_WINDOW_MS) {
      records.push(createFollowUpRecord(task, "due_soon", {
        severity: task.priority === "critical" ? "high" : "medium",
        message: `${task.title} is due within the next 24 hours.`,
      }));
    }

    if (
      typeof task.metadata?.githubIssueApprovalId === "string" &&
      !task.metadata.githubIssueNumber
    ) {
      records.push(createFollowUpRecord(task, "ticket_pending", {
        severity: "low",
        message: `${task.title} is waiting on approval or execution for GitHub issue tracking.`,
      }));
    }
  }

  return records.sort(
    (left, right) =>
      new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime()
  );
}

function createFollowUpRecord(
  task: SuggestedTask,
  kind: WorkflowFollowUpRecord["kind"],
  input: {
    severity: WorkflowFollowUpRecord["severity"];
    message: string;
  }
): WorkflowFollowUpRecord {
  return {
    id: `workflow-follow-up-${kind}-${task.id}`,
    taskId: task.id,
    taskTitle: task.title,
    kind,
    severity: input.severity,
    status: "open",
    message: input.message,
    createdAt: new Date().toISOString(),
    dueDate: task.dueDate,
    owner: task.suggestedOwner,
    metadata: {
      priority: task.priority,
      status: task.status,
      source: task.source,
      sourceAgentId: task.sourceAgentId,
    },
  };
}
