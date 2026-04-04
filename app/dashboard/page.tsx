import { ApprovalQueueCard } from "@/components/dashboard/approval-queue-card";
import { ActivityTimelineCard } from "@/components/dashboard/activity-timeline-card";
import { CostRiskCard } from "@/components/dashboard/cost-risk-card";
import { SuggestedTasksCard } from "@/components/dashboard/suggested-tasks-card";
import { WeeklySummaryCard } from "@/components/dashboard/weekly-summary-card";
import { MetricTile } from "@/components/ui/metric-tile";
import { PageHeader } from "@/components/ui/page-header";
import { StatusPill } from "@/components/ui/status-pill";
import { requireSession } from "@/lib/auth/session";
import { listWorkspaceJobs } from "@/lib/data/jobs";
import { getWorkspaceSnapshot } from "@/lib/data/workspace";

export default async function DashboardPage() {
  await requireSession("/dashboard");

  const [snapshot, jobs] = await Promise.all([
    getWorkspaceSnapshot(),
    listWorkspaceJobs(1),
  ]);

  const pendingApprovals = snapshot.approvalRequests.filter(
    (approval) => approval.status === "pending"
  ).length;
  const openTasks = snapshot.tasks.filter((task) => task.status !== "completed").length;
  const alerts = snapshot.riskAlerts.length;
  const latestJob = jobs[0];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        description="Review this week in one pass: summary first, then follow-up tasks, pending approvals, and spend posture."
        status={
          <>
            {latestJob ? (
              <StatusPill tone="info">Refresh {latestJob.state}</StatusPill>
            ) : null}
            <StatusPill tone={pendingApprovals > 0 ? "warning" : "success"}>
              {pendingApprovals > 0
                ? `${pendingApprovals} approvals pending`
                : "No pending approvals"}
            </StatusPill>
          </>
        }
      />

      {/* Top Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile
          label="Open tasks"
          value={openTasks}
          tone={openTasks > 5 ? "warning" : "accent"}
        />
        <MetricTile
          label="Pending approvals"
          value={pendingApprovals}
          tone={pendingApprovals > 0 ? "warning" : "success"}
        />
        <MetricTile
          label="Active alerts"
          value={alerts}
          tone={alerts > 0 ? "warning" : "success"}
        />
      </div>

      {/* Primary Content Grid */}
      <div className="grid gap-6 lg:grid-cols-12">
        {/* Left Column - Primary Summary */}
        <div className="lg:col-span-8">
          <WeeklySummaryCard summary={snapshot.engineeringSummary} />
        </div>

        {/* Right Column - Spend & Risk */}
        <div className="lg:col-span-4">
          <CostRiskCard report={snapshot.costReport} compact />
        </div>
      </div>

      {/* Secondary Grid - Tasks and Approvals */}
      <div className="grid gap-6 lg:grid-cols-2">
        <SuggestedTasksCard tasks={snapshot.tasks} limit={5} />
        <ApprovalQueueCard approvals={snapshot.approvalRequests} limit={5} />
      </div>

      {/* Bottom Section - Activity Timeline */}
      <ActivityTimelineCard entries={snapshot.timeline} limit={6} />
    </div>
  );
}
