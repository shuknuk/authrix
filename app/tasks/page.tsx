import { ChatTaskDispatchCard } from "@/components/dashboard/chat-task-dispatch-card";
import { RiskAlertsCard } from "@/components/dashboard/risk-alerts-card";
import { SuggestedTasksCard } from "@/components/dashboard/suggested-tasks-card";
import { TaskHealthCard } from "@/components/dashboard/task-health-card";
import { WorkflowFollowUpCard } from "@/components/dashboard/workflow-follow-up-card";
import { PageHeader } from "@/components/ui/page-header";
import { requireSession } from "@/lib/auth/session";
import { getWorkspaceSnapshot } from "@/lib/data/workspace";
import { loadSlackWorkspaceState } from "@/lib/slack/store";
import { listWorkflowFollowUpRecords } from "@/lib/workflow/store";

export default async function TasksPage() {
  await requireSession("/tasks");

  const [snapshot, slackState, workflowFollowUps] = await Promise.all([
    getWorkspaceSnapshot(),
    loadSlackWorkspaceState(),
    listWorkflowFollowUpRecords(8),
  ]);
  const workflowAlerts = snapshot.riskAlerts.filter(
    (alert) => alert.category === "workflow"
  );
  const driftAlerts = snapshot.riskAlerts.filter((alert) => alert.category === "drift");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Suggested follow-ups, ownership gaps, and stale work derived from Authrix's persisted product state."
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <TaskHealthCard tasks={snapshot.tasks} />
        <WorkflowFollowUpCard records={workflowFollowUps} />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RiskAlertsCard
          alerts={workflowAlerts}
          title="Workflow Alerts"
          description="Ownership, overdue work, and follow-through signals detected by Authrix."
        />
        <RiskAlertsCard
          alerts={driftAlerts}
          title="Drift Alerts"
          description="Cross-system drift signals where decisions, documentation, approvals, or unresolved topics are starting to slip."
        />
      </div>
      <ChatTaskDispatchCard dispatches={slackState.taskDispatches} />
      <SuggestedTasksCard tasks={snapshot.tasks} />
    </div>
  );
}
