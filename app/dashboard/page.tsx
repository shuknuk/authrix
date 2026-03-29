import { ApprovalQueueCard } from "@/components/dashboard/approval-queue-card";
import { CostRiskCard } from "@/components/dashboard/cost-risk-card";
import { SuggestedTasksCard } from "@/components/dashboard/suggested-tasks-card";
import { WeeklySummaryCard } from "@/components/dashboard/weekly-summary-card";
import { PageHeader } from "@/components/ui/page-header";
import { requireSession } from "@/lib/auth/session";
import { getWorkspaceSnapshot } from "@/lib/data/workspace";

export default async function DashboardPage() {
  await requireSession("/dashboard");

  const snapshot = await getWorkspaceSnapshot();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="A live operational snapshot of engineering progress, follow-up work, cost posture, and pending approvals."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WeeklySummaryCard summary={snapshot.engineeringSummary} />
        <SuggestedTasksCard tasks={snapshot.tasks} limit={5} compact />
        <CostRiskCard report={snapshot.costReport} compact />
        <ApprovalQueueCard approvals={snapshot.approvalRequests} limit={5} />
      </div>
    </div>
  );
}
