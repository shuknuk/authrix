import { ApprovalQueueCard } from "@/components/dashboard/approval-queue-card";
import { CostRiskCard } from "@/components/dashboard/cost-risk-card";
import { SecurityPostureCard } from "@/components/dashboard/security-posture-card";
import { SuggestedTasksCard } from "@/components/dashboard/suggested-tasks-card";
import { WeeklySummaryCard } from "@/components/dashboard/weekly-summary-card";
import { PageHeader } from "@/components/ui/page-header";
import { requireSession } from "@/lib/auth/session";
import { listWorkspaceJobs } from "@/lib/data/jobs";
import { getWorkspaceSnapshot } from "@/lib/data/workspace";
import { getSecurityPosture } from "@/lib/security/status";

export default async function DashboardPage() {
  await requireSession("/dashboard");

  const [snapshot, jobs, securityPosture] = await Promise.all([
    getWorkspaceSnapshot(),
    listWorkspaceJobs(1),
    Promise.resolve(getSecurityPosture()),
  ]);
  const engineeringPipeline = snapshot.state.pipelines.find(
    (pipeline) => pipeline.id === "engineering-summary"
  );
  const latestJob = jobs[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="A live operational snapshot of engineering progress, follow-up work, cost posture, and pending approvals."
      />

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-zinc-800 bg-zinc-900/70 px-4 py-3 text-xs text-zinc-400">
        <span>Workspace state persisted to filesystem</span>
        <span>Refreshed {new Date(snapshot.state.refreshedAt).toLocaleString()}</span>
        {engineeringPipeline ? (
          <span
            className={`rounded-full px-2.5 py-1 ${
              engineeringPipeline.health === "ready"
                ? "bg-green-900/30 text-green-300"
                : engineeringPipeline.health === "fallback"
                  ? "bg-amber-900/30 text-amber-300"
                  : "bg-red-900/30 text-red-300"
            }`}
          >
            Engineering pipeline: {engineeringPipeline.provider}
          </span>
        ) : null}
        {latestJob ? (
          <span
            className={`rounded-full px-2.5 py-1 ${
              latestJob.state === "completed"
                ? "bg-green-900/30 text-green-300"
                : latestJob.state === "failed"
                  ? "bg-red-900/30 text-red-300"
                  : "bg-amber-900/30 text-amber-300"
            }`}
          >
            Latest refresh job: {latestJob.state}
          </span>
        ) : null}
        <span
          className={`rounded-full px-2.5 py-1 ${
            securityPosture.deploymentMode === "worker-box"
              ? "bg-green-900/30 text-green-300"
              : "bg-amber-900/30 text-amber-300"
          }`}
        >
          Deployment: {securityPosture.deploymentMode}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WeeklySummaryCard summary={snapshot.engineeringSummary} />
        <SuggestedTasksCard tasks={snapshot.tasks} limit={5} compact />
        <CostRiskCard report={snapshot.costReport} compact />
        <ApprovalQueueCard approvals={snapshot.approvalRequests} limit={5} />
        <SecurityPostureCard posture={securityPosture} compact />
      </div>
    </div>
  );
}
