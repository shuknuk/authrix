import { ApprovalQueueCard } from "@/components/dashboard/approval-queue-card";
import { AgentRosterCard } from "@/components/dashboard/agent-roster-card";
import { AgentHandoffsCard } from "@/components/dashboard/agent-handoffs-card";
import { ChatModelActivityCard } from "@/components/dashboard/chat-model-activity-card";
import { ChatTaskDispatchCard } from "@/components/dashboard/chat-task-dispatch-card";
import { ChatActivityCard } from "@/components/dashboard/chat-activity-card";
import { CostRiskCard } from "@/components/dashboard/cost-risk-card";
import { DelegationHistoryCard } from "@/components/dashboard/delegation-history-card";
import { getDeploymentReadinessReport } from "@/lib/deployment/readiness";
import { ModelLayerCard } from "@/components/dashboard/model-layer-card";
import { OperatorOnboardingCard } from "@/components/dashboard/operator-onboarding-card";
import { ProactiveAutonomyCard } from "@/components/dashboard/proactive-autonomy-card";
import { RiskAlertsCard } from "@/components/dashboard/risk-alerts-card";
import { RuntimeRunsCard } from "@/components/dashboard/runtime-runs-card";
import { RuntimeSessionsCard } from "@/components/dashboard/runtime-sessions-card";
import { ScheduledBriefingsCard } from "@/components/dashboard/scheduled-briefings-card";
import { SecurityPostureCard } from "@/components/dashboard/security-posture-card";
import { SuggestedTasksCard } from "@/components/dashboard/suggested-tasks-card";
import { WeeklySummaryCard } from "@/components/dashboard/weekly-summary-card";
import { WorkspaceMemoryCard } from "@/components/dashboard/workspace-memory-card";
import { PageHeader } from "@/components/ui/page-header";
import { requireSession } from "@/lib/auth/session";
import { listWorkspaceJobs } from "@/lib/data/jobs";
import { getWorkspaceSnapshot } from "@/lib/data/workspace";
import { getSecurityPosture } from "@/lib/security/status";
import { loadSlackWorkspaceState } from "@/lib/slack/store";
import { getModelLayerStatus } from "@/lib/models/provider";
import { listAuthrixRuntimeRuns, listAuthrixRuntimeSessions } from "@/lib/runtime/service";

export default async function DashboardPage() {
  await requireSession("/dashboard");

  const [
    snapshot,
    jobs,
    securityPosture,
    readinessReport,
    slackState,
    modelLayerStatus,
    runtimeSessions,
    runtimeRuns,
  ] = await Promise.all([
    getWorkspaceSnapshot(),
    listWorkspaceJobs(6),
    Promise.resolve(getSecurityPosture()),
    getDeploymentReadinessReport(),
    loadSlackWorkspaceState(),
    Promise.resolve(getModelLayerStatus()),
    listAuthrixRuntimeSessions(4),
    listAuthrixRuntimeRuns(4),
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
            Latest job: {latestJob.state}
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
        <RuntimeSessionsCard sessions={runtimeSessions} limit={4} />
        <ScheduledBriefingsCard
          schedules={slackState.briefingSchedules}
          briefings={slackState.briefings}
        />
        <ProactiveAutonomyCard
          jobs={jobs}
          schedules={slackState.briefingSchedules}
          briefings={slackState.briefings}
          sessions={runtimeSessions}
          memories={snapshot.memories}
        />
        <ChatModelActivityCard
          dispatches={slackState.dispatches}
          briefings={slackState.briefings}
        />
        <RuntimeRunsCard runs={runtimeRuns} limit={4} />
        <DelegationHistoryCard delegations={slackState.delegations} />
        <WorkspaceMemoryCard memories={snapshot.memories} limit={4} />
        <WeeklySummaryCard summary={snapshot.engineeringSummary} />
        <ChatTaskDispatchCard dispatches={slackState.taskDispatches} />
        <SuggestedTasksCard tasks={snapshot.tasks} limit={5} compact />
        <CostRiskCard report={snapshot.costReport} compact />
        <ApprovalQueueCard approvals={snapshot.approvalRequests} limit={5} />
        <AgentHandoffsCard handoffs={snapshot.handoffs} limit={4} />
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
