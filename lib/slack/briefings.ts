import { getWorkspaceSnapshot } from "@/lib/data/workspace";
import { postSlackMessage } from "@/lib/slack/client";
import { getSlackConfig } from "@/lib/slack/config";
import {
  listSlackBriefingSchedules,
  saveSlackBriefingRun,
} from "@/lib/slack/store";
import { recordSlackBriefingInWorkspace } from "@/lib/slack/workspace-sync";
import type { SlackBriefingRecord, SlackBriefingSchedule } from "@/types/messaging";

export async function runScheduledSlackBriefing(
  scheduleId?: string
): Promise<{
  schedule: SlackBriefingSchedule;
  record: SlackBriefingRecord;
}> {
  const schedules = await listSlackBriefingSchedules();
  const schedule = selectSchedule(schedules, scheduleId);
  if (!schedule) {
    throw new Error("No active Slack briefing schedule is available.");
  }

  const snapshot = await getWorkspaceSnapshot();
  const pendingApprovals = snapshot.approvalRequests.filter(
    (item) => item.status === "pending"
  );
  const driftAlerts = snapshot.riskAlerts.filter((item) => item.category === "drift");
  const openTasks = snapshot.tasks.filter((item) => item.status !== "completed");
  const highPriorityTasks = openTasks.filter(
    (item) => item.priority === "critical" || item.priority === "high"
  );
  const targetChannelId = schedule.targetChannelId || getSlackConfig().defaultChannelId;
  const title = `${schedule.title} · ${formatDateLabel(new Date().toISOString())}`;
  const body = [
    `*Engineering*: ${snapshot.engineeringSummary.overallSummary}`,
    `*Follow-through*: ${highPriorityTasks.length} high-priority task(s), ${pendingApprovals.length} approval(s) waiting, ${driftAlerts.length} drift alert(s).`,
    `*Operations*: ${snapshot.costReport.summary}`,
    buildTaskLine(highPriorityTasks),
    buildApprovalLine(pendingApprovals),
  ]
    .filter(Boolean)
    .join("\n");

  let deliveryStatus: SlackBriefingRecord["deliveryStatus"] = "generated";
  let deliveredAt: string | undefined;
  let error: string | undefined;

  if (targetChannelId) {
    try {
      await postSlackMessage({
        channel: targetChannelId,
        text: `${title}\n\n${body}`,
      });
      deliveryStatus = "delivered";
      deliveredAt = new Date().toISOString();
    } catch (cause) {
      deliveryStatus = "failed";
      error = cause instanceof Error ? cause.message : "Slack delivery failed.";
    }
  }

  const result = await saveSlackBriefingRun({
    scheduleId: schedule.id,
    title,
    body,
    deliveryStatus,
    targetChannelId,
    deliveredAt,
    error,
    relatedRecordIds: [
      snapshot.engineeringSummary.id,
      snapshot.costReport.id,
      ...highPriorityTasks.slice(0, 3).map((item) => item.id),
      ...pendingApprovals.slice(0, 3).map((item) => item.id),
      ...driftAlerts.slice(0, 3).map((item) => item.id),
    ],
  });

  await recordSlackBriefingInWorkspace(result.record, result.outgoingMessage);
  return {
    schedule: result.schedule,
    record: result.record,
  };
}

function selectSchedule(
  schedules: SlackBriefingSchedule[],
  scheduleId?: string
): SlackBriefingSchedule | undefined {
  if (scheduleId) {
    return schedules.find((entry) => entry.id === scheduleId && entry.status === "active");
  }

  const due = schedules.find(
    (entry) =>
      entry.status === "active" &&
      (!entry.nextRunAt || new Date(entry.nextRunAt).getTime() <= Date.now())
  );
  return due ?? schedules.find((entry) => entry.status === "active");
}

function buildTaskLine(
  tasks: Array<{ title: string; suggestedOwner?: string }>
): string | null {
  if (tasks.length === 0) {
    return null;
  }

  const lead = tasks[0];
  return `*Top task*: ${lead.title}${lead.suggestedOwner ? ` (owner: ${lead.suggestedOwner})` : ""}`;
}

function buildApprovalLine(
  approvals: Array<{ title: string; riskLevel: string }>
): string | null {
  if (approvals.length === 0) {
    return null;
  }

  const lead = approvals[0];
  return `*Approval queue*: ${lead.title} (${lead.riskLevel} risk)`;
}

function formatDateLabel(value: string): string {
  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}
