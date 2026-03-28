import { ApprovalQueueCard } from "@/components/dashboard/approval-queue-card";
import { CostRiskCard } from "@/components/dashboard/cost-risk-card";
import { SuggestedTasksCard } from "@/components/dashboard/suggested-tasks-card";
import { WeeklySummaryCard } from "@/components/dashboard/weekly-summary-card";
import { PageHeader } from "@/components/ui/page-header";
import {
  getApprovalRequests,
  getCostReport,
  getEngineeringSummary,
  getSuggestedTasks,
} from "@/lib/data/workspace";

export default async function DashboardPage() {
  const [summary, tasks, costs, approvals] = await Promise.all([
    getEngineeringSummary(),
    getSuggestedTasks(),
    getCostReport(),
    getApprovalRequests(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="A live operational snapshot of engineering progress, follow-up work, cost posture, and pending approvals."
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WeeklySummaryCard summary={summary} />
        <SuggestedTasksCard tasks={tasks} limit={5} compact />
        <CostRiskCard report={costs} compact />
        <ApprovalQueueCard approvals={approvals} limit={5} />
      </div>
    </div>
  );
}
