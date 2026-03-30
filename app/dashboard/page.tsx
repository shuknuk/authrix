import { ApprovalQueueCard } from "@/components/dashboard/approval-queue-card";
import { AgentRosterCard } from "@/components/dashboard/agent-roster-card";
import { ChatModelActivityCard } from "@/components/dashboard/chat-model-activity-card";
import { ChatTaskDispatchCard } from "@/components/dashboard/chat-task-dispatch-card";
import { ChatActivityCard } from "@/components/dashboard/chat-activity-card";
import { CostRiskCard } from "@/components/dashboard/cost-risk-card";
import { DelegationHistoryCard } from "@/components/dashboard/delegation-history-card";
import { getDeploymentReadinessReport } from "@/lib/deployment/readiness";
import { ModelLayerCard } from "@/components/dashboard/model-layer-card";
import { OperatorOnboardingCard } from "@/components/dashboard/operator-onboarding-card";
import { RiskAlertsCard } from "@/components/dashboard/risk-alerts-card";
import { ScheduledBriefingsCard } from "@/components/dashboard/scheduled-briefings-card";
import { SecurityPostureCard } from "@/components/dashboard/security-posture-card";
import { SuggestedTasksCard } from "@/components/dashboard/suggested-tasks-card";
import { WeeklySummaryCard } from "@/components/dashboard/weekly-summary-card";
import { PageHeader } from "@/components/ui/page-header";
import { requireSession } from "@/lib/auth/session";
import { listWorkspaceJobs } from "@/lib/data/jobs";
import { getWorkspaceSnapshot } from "@/lib/data/workspace";
import { getSecurityPosture } from "@/lib/security/status";
import { loadSlackWorkspaceState } from "@/lib/slack/store";
import { getModelLayerStatus } from "@/lib/models/provider";

export default async function DashboardPage() {
  await requireSession("/dashboard");

  const [snapshot, jobs, securityPosture, readinessReport, slackState, modelLayerStatus] =
    await Promise.all([
    getWorkspaceSnapshot(),
    listWorkspaceJobs(1),
    Promise.resolve(getSecurityPosture()),
    getDeploymentReadinessReport(),
    loadSlackWorkspaceState(),
    Promise.resolve(getModelLayerStatus()),
  ]);
  const engineeringPipeline = snapshot.state.pipelines.find(
    (pipeline) => pipeline.id === "engineering-summary"
  );
  const driftAlerts = snapshot.riskAlerts.filter((alert) => alert.category === "drift");
  const latestJob = jobs[0];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="A live operational snapshot of engineering progress, follow-through, approvals, and the health of your startup's always-on worker system."
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
        <span
          className={`rounded-full px-2.5 py-1 ${
            readinessReport.overallStatus === "ready"
              ? "bg-green-900/30 text-green-300"
              : readinessReport.overallStatus === "warning"
                ? "bg-amber-900/30 text-amber-300"
                : "bg-red-900/30 text-red-300"
          }`}
        >
          Bring-up readiness: {readinessReport.overallStatus}
        </span>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <OperatorOnboardingCard report={readinessReport} />
        <AgentRosterCard />
        <ModelLayerCard status={modelLayerStatus} />
        <ChatActivityCard
          conversations={slackState.conversations}
          dispatches={slackState.dispatches}
        />
        <ScheduledBriefingsCard
          schedules={slackState.briefingSchedules}
          briefings={slackState.briefings}
        />
        <ChatModelActivityCard
          dispatches={slackState.dispatches}
          briefings={slackState.briefings}
        />
        <DelegationHistoryCard delegations={slackState.delegations} />
        <WeeklySummaryCard summary={snapshot.engineeringSummary} />
        <ChatTaskDispatchCard dispatches={slackState.taskDispatches} />
        <SuggestedTasksCard tasks={snapshot.tasks} limit={5} compact />
        <CostRiskCard report={snapshot.costReport} compact />
        <ApprovalQueueCard approvals={snapshot.approvalRequests} limit={5} />
        <RiskAlertsCard
          alerts={driftAlerts}
          title="Operational Drift"
          description="Authrix watches for docs drift, stalled approvals, and recurring unresolved topics."
          limit={3}
        />
        <SecurityPostureCard posture={securityPosture} compact />
      </div>
    </div>
  );
}
