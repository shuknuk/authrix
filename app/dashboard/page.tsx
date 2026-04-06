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
import { RuntimeRunsCard } from "@/components/dashboard/runtime-runs-card";
import { RuntimeSessionsCard } from "@/components/dashboard/runtime-sessions-card";
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
import { listAuthrixRuntimeRuns, listAuthrixRuntimeSessions } from "@/lib/runtime/service";

export default async function DashboardPage() {
  await requireSession("/dashboard");

  try {
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
      listWorkspaceJobs(1),
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

      <div className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] px-4 py-3 text-xs">
        <span className="text-[var(--foreground-muted)]">Workspace state persisted to filesystem</span>
        <span className="hidden sm:inline text-[var(--foreground-muted)]">·</span>
        <span className="text-[var(--foreground-muted)]">Refreshed {new Date(snapshot.state.refreshedAt).toLocaleString()}</span>
        <div className="flex flex-wrap gap-2">
          {engineeringPipeline ? (
            <span
              className={`rounded-full px-2.5 py-1 whitespace-nowrap ${
                engineeringPipeline.health === "ready"
                  ? "bg-[var(--success-soft)] text-[var(--success)]"
                  : engineeringPipeline.health === "fallback"
                    ? "bg-[var(--warning-soft)] text-[var(--clay)]"
                    : "bg-[var(--danger-soft)] text-[var(--danger)]"
              }`}
            >
              Pipeline: {engineeringPipeline.provider}
            </span>
          ) : null}
          {latestJob ? (
            <span
              className={`rounded-full px-2.5 py-1 whitespace-nowrap ${
                latestJob.state === "completed"
                  ? "bg-[var(--success-soft)] text-[var(--success)]"
                  : latestJob.state === "failed"
                    ? "bg-[var(--danger-soft)] text-[var(--danger)]"
                    : "bg-[var(--warning-soft)] text-[var(--clay)]"
              }`}
            >
              Job: {latestJob.state}
            </span>
          ) : null}
          <span
            className={`rounded-full px-2.5 py-1 whitespace-nowrap ${
              securityPosture.deploymentMode === "worker-box"
                ? "bg-[var(--success-soft)] text-[var(--success)]"
                : "bg-[var(--warning-soft)] text-[var(--clay)]"
            }`}
          >
            {securityPosture.deploymentMode}
          </span>
          <span
            className={`rounded-full px-2.5 py-1 whitespace-nowrap ${
              readinessReport.overallStatus === "ready"
                ? "bg-[var(--success-soft)] text-[var(--success)]"
                : readinessReport.overallStatus === "warning"
                  ? "bg-[var(--warning-soft)] text-[var(--clay)]"
                  : "bg-[var(--danger-soft)] text-[var(--danger)]"
            }`}
          >
            {readinessReport.overallStatus}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
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
        <ChatModelActivityCard
          dispatches={slackState.dispatches}
          briefings={slackState.briefings}
        />
        <RuntimeRunsCard runs={runtimeRuns} limit={4} />
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
  } catch (error) {
    console.error("Dashboard error:", error);
    return (
      <div className="p-8">
        <h1 className="text-xl font-bold mb-4">Dashboard Error</h1>
        <pre className="bg-red-50 p-4 rounded overflow-auto text-sm">
          {error instanceof Error ? error.message : String(error)}
        </pre>
      </div>
    );
  }
}
