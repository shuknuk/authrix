import { ChatTaskDispatchCard } from "@/components/dashboard/chat-task-dispatch-card";
import { RiskAlertsCard } from "@/components/dashboard/risk-alerts-card";
import { SuggestedTasksCard } from "@/components/dashboard/suggested-tasks-card";
import { TaskHealthCard } from "@/components/dashboard/task-health-card";
import { MetricTile } from "@/components/ui/metric-tile";
import { PageHeader } from "@/components/ui/page-header";
import { SectionFrame } from "@/components/ui/section-frame";
import { StatusPill } from "@/components/ui/status-pill";
import { requireSession } from "@/lib/auth/session";
import { getWorkspaceSnapshot } from "@/lib/data/workspace";
import { loadSlackWorkspaceState } from "@/lib/slack/store";

export default async function TasksPage() {
  await requireSession("/tasks");

  const [snapshot, slackState] = await Promise.all([
    getWorkspaceSnapshot(),
    loadSlackWorkspaceState(),
  ]);

  const workflowAlerts = snapshot.riskAlerts.filter((alert) => alert.category === "workflow");
  const driftAlerts = snapshot.riskAlerts.filter((alert) => alert.category === "drift");
  const openTasks = snapshot.tasks.filter((task) => task.status !== "completed");
  const overdueTasks = openTasks.filter(
    (task) => task.dueDate && new Date(task.dueDate).getTime() < Date.now()
  );
  const missingOwners = openTasks.filter((task) => !task.suggestedOwner);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Tasks"
        eyebrow="Authrix Follow-through"
        description="The follow-up queue, ownership quality, and dispatch history in one operating view."
        status={
          <>
            <StatusPill tone="info">{openTasks.length} open tasks</StatusPill>
            <StatusPill tone={overdueTasks.length > 0 ? "warning" : "success"}>
              {overdueTasks.length > 0 ? `${overdueTasks.length} overdue` : "No overdue tasks"}
            </StatusPill>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <MetricTile label="Open" value={openTasks.length} tone="accent" />
        <MetricTile label="Overdue" value={overdueTasks.length} tone={overdueTasks.length > 0 ? "warning" : "success"} />
        <MetricTile label="Missing owners" value={missingOwners.length} tone={missingOwners.length > 0 ? "danger" : "success"} />
        <MetricTile label="Dispatches" value={slackState.taskDispatches.length} />
      </div>

      <SectionFrame
        title="Primary Task Queue"
        description="Suggested work appears as a table-first queue for quick operator scan."
      >
        <SuggestedTasksCard tasks={snapshot.tasks} />
      </SectionFrame>

      <SectionFrame
        title="Execution Health"
        description="Ownership and workflow risk signals that affect follow-through quality."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <TaskHealthCard tasks={snapshot.tasks} />
          <RiskAlertsCard
            alerts={workflowAlerts}
            title="Workflow Alerts"
            description="Signals for missing owners, stale work, and blocked follow-through."
          />
        </div>
      </SectionFrame>

      <SectionFrame
        title="Dispatch And Drift"
        description="Slack task routing evidence and drift signals from the same period."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <ChatTaskDispatchCard dispatches={slackState.taskDispatches} />
          <RiskAlertsCard
            alerts={driftAlerts}
            title="Drift Alerts"
            description="Cross-signal drift where ownership, docs, approvals, or execution no longer align."
          />
        </div>
      </SectionFrame>
    </div>
  );
}
