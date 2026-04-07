import { ApprovalQueueCard } from "@/components/dashboard/approval-queue-card";
import { AgentRosterCard } from "@/components/dashboard/agent-roster-card";
import { ChatModelActivityCard } from "@/components/dashboard/chat-model-activity-card";
import { ChatTaskDispatchCard } from "@/components/dashboard/chat-task-dispatch-card";
import { ChatActivityCard } from "@/components/dashboard/chat-activity-card";
import { ConnectionPlaceholder } from "@/components/dashboard/connection-placeholder";
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
import { CardShell } from "@/components/ui/card-shell";
import { PageHeader } from "@/components/ui/page-header";
import { requireSession } from "@/lib/auth/session";
import { listWorkspaceJobs } from "@/lib/data/jobs";
import { getWorkspaceSnapshot } from "@/lib/data/workspace";
import { getSecurityPosture } from "@/lib/security/status";
import { loadSlackWorkspaceState } from "@/lib/slack/store";
import { getModelLayerStatus } from "@/lib/models/provider";
import { listAuthrixRuntimeRuns, listAuthrixRuntimeSessions } from "@/lib/runtime/service";
import { getGitHubIngestionResult } from "@/lib/github/service";
import { getCostDataSources } from "@/lib/costs/service";
import Link from "next/link";
// Simple inline SVG icons
function GitHubIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
    </svg>
  );
}

function VercelIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 76 65" fill="currentColor">
      <path d="M37.5274 0L75.0548 65H0L37.5274 0Z" />
    </svg>
  );
}

function OpenAIIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M22.282 9.821a5.985 5.985 0 0 0-.516-4.91 6.046 6.046 0 0 0-6.51-2.9A6.065 6.065 0 0 0 4.981 4.18a5.985 5.985 0 0 0-3.998 2.9 6.046 6.046 0 0 0 .743 7.097 5.98 5.98 0 0 0 .51 4.911 6.051 6.051 0 0 0 6.515 2.9A5.985 5.985 0 0 0 13.26 24a6.056 6.056 0 0 0 5.772-4.206 5.99 5.99 0 0 0 3.997-2.9 6.056 6.056 0 0 0-.747-7.073zM13.26 22.43a4.476 4.476 0 0 1-2.876-1.04l.141-.081 4.779-2.758a.795.795 0 0 0 .392-.681v-6.737l2.02 1.168a.071.071 0 0 1 .038.052v5.583a4.504 4.504 0 0 1-4.494 4.494zM3.6 18.304a4.47 4.47 0 0 1-.535-3.014l.142.085 4.783 2.759a.771.771 0 0 0 .78 0l5.843-3.369v2.332a.08.08 0 0 1-.033.062L9.74 19.95a4.499 4.499 0 0 1-6.14-1.646zM2.34 7.896a4.485 4.485 0 0 1 2.366-1.973V11.6a.766.766 0 0 0 .388.676l5.815 3.355-2.02 1.168a.076.076 0 0 1-.071 0l-4.83-2.786A4.504 4.504 0 0 1 2.34 7.896zm16.597 3.855l-5.833-3.387L15.119 7.2a.076.076 0 0 1 .071 0l4.83 2.791a4.494 4.494 0 0 1-.676 8.105v-5.678a.79.79 0 0 0-.407-.667zm2.01-3.212l-.141-.085-4.774-2.782a.776.776 0 0 0-.785 0L9.409 10.87V8.538a.066.066 0 0 1 .028-.061l4.83-2.787a4.5 4.5 0 0 1 6.68 4.66zm-12.64 4.27l-2.02-1.164a.067.067 0 0 1-.038-.057V6.2a4.5 4.5 0 0 1 7.375-3.453l-.142.08L8.704 5.46a.795.795 0 0 0-.393.681zm1.097-2.365l2.602-1.5 2.607 1.5v2.999l-2.597 1.5-2.607-1.5z"/>
    </svg>
  );
}

function MessageSquareIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

function ServerIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="8" rx="2" ry="2"/>
      <rect x="2" y="14" width="20" height="8" rx="2" ry="2"/>
      <line x1="6" y1="6" x2="6.01" y2="6"/>
      <line x1="6" y1="18" x2="6.01" y2="18"/>
    </svg>
  );
}

function ZapIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  );
}

function AlertCircleIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

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
      githubIngestion,
      costSources,
    ] = await Promise.all([
      getWorkspaceSnapshot(),
      listWorkspaceJobs(1),
      Promise.resolve(getSecurityPosture()),
      getDeploymentReadinessReport(),
      loadSlackWorkspaceState(),
      Promise.resolve(getModelLayerStatus()),
      listAuthrixRuntimeSessions(4),
      listAuthrixRuntimeRuns(4),
      getGitHubIngestionResult(),
      getCostDataSources(),
    ]);

    const engineeringPipeline = snapshot.state.pipelines.find(
      (pipeline) => pipeline.id === "engineering-summary"
    );
    const driftAlerts = snapshot.riskAlerts.filter((alert) => alert.category === "drift");
    const latestJob = jobs[0];

    // Build integration status for display
    const vercelConnected = costSources.find(s => s.service === "Vercel")?.connected ?? false;
    const openaiConnected = costSources.find(s => s.service === "OpenAI")?.connected ?? false;
    const githubActionsConnected = costSources.find(s => s.service === "GitHub Actions")?.connected ?? false;

    return (
      <div className="space-y-6">
        <PageHeader
          title="Dashboard"
          description="A live operational snapshot of engineering progress, follow-through, approvals, and the health of your startup's always-on worker system."
        />

        {/* Status Bar */}
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

        {/* Connections Summary Section */}
        <section>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
              Connections
            </h2>
            <Link
              href="/connections"
              className="text-xs text-[var(--primary)] hover:underline"
            >
              Manage connections →
            </Link>
          </div>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
            {/* GitHub */}
            <Link
              href="/connections"
              className={`group flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-[var(--background-elevated)] ${
                githubIngestion.integration.connected
                  ? githubIngestion.integration.mode === "live"
                    ? "border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success)]"
                    : "border-[var(--warning-border)] bg-[var(--warning-soft)] text-[var(--clay)]"
                  : "border-[var(--border)] bg-[var(--background)] text-[var(--foreground-muted)]"
              }`}
            >
              <GitHubIcon className="h-4 w-4" />
              <span className="font-medium">GitHub</span>
              <span className="text-xs opacity-70">
                {githubIngestion.integration.connected
                  ? githubIngestion.integration.mode === "live"
                    ? "● live"
                    : "○ mock"
                  : "○ not connected"}
              </span>
            </Link>

            {/* Vercel */}
            <Link
              href="/connections"
              className={`group flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-[var(--background-elevated)] ${
                vercelConnected
                  ? "border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success)]"
                  : "border-[var(--border)] bg-[var(--background)] text-[var(--foreground-muted)]"
              }`}
            >
              <VercelIcon />
              <span className="font-medium">Vercel</span>
              <span className="text-xs opacity-70">
                {vercelConnected ? "● configured" : "○ not configured"}
              </span>
            </Link>

            {/* OpenAI */}
            <Link
              href="/connections"
              className={`group flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-[var(--background-elevated)] ${
                openaiConnected
                  ? "border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success)]"
                  : "border-[var(--border)] bg-[var(--background)] text-[var(--foreground-muted)]"
              }`}
            >
              <OpenAIIcon />
              <span className="font-medium">OpenAI</span>
              <span className="text-xs opacity-70">
                {openaiConnected ? "● configured" : "○ not configured"}
              </span>
            </Link>

            {/* Slack */}
            <Link
              href="/connections"
              className={`group flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-[var(--background-elevated)] ${
                slackState.workspaceId
                  ? "border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success)]"
                  : "border-[var(--border)] bg-[var(--background)] text-[var(--foreground-muted)]"
              }`}
            >
              <MessageSquareIcon className="h-4 w-4" />
              <span className="font-medium">Slack</span>
              <span className="text-xs opacity-70">
                {slackState.workspaceId ? "● connected" : "○ not connected"}
              </span>
            </Link>
          </div>
        </section>

        {/* This Week's Engineering Section */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
            This Week&apos;s Engineering
          </h2>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            {githubIngestion.integration.connected ? (
              <WeeklySummaryCard summary={snapshot.engineeringSummary} />
            ) : (
              <ConnectionPlaceholder
                service="GitHub"
                description="Connect GitHub to see your weekly engineering summary with activity highlights, repository breakdowns, and contributor insights."
                href="/connections"
                icon={<GitHubIcon className="h-6 w-6" />}
                tone="accent"
              />
            )}

            {githubIngestion.integration.connected ? (
              <CardShell
                title="GitHub Activity"
                description="Recent commits, PRs, and issues from connected repositories."
                tone="default"
              >
                <div className="space-y-3">
                  {githubIngestion.events.slice(0, 5).map((event) => (
                    <div
                      key={event.id}
                      className="flex items-start gap-3 rounded-lg border border-[var(--border)] p-3"
                    >
                      <div className="mt-0.5">
                        <GitHubIcon className="h-4 w-4 text-[var(--foreground-muted)]" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-[var(--foreground)]">
                          {event.title}
                        </p>
                        <p className="text-xs text-[var(--foreground-muted)]">
                          {event.repo} · {event.author} ·{" "}
                          {new Date(event.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {githubIngestion.events.length === 0 && (
                    <p className="text-sm text-[var(--foreground-muted)]">
                      No recent activity found.
                    </p>
                  )}
                </div>
              </CardShell>
            ) : (
              <CardShell
                title="GitHub Activity"
                description="Live activity feed from your repositories."
                tone="default"
              >
                <div className="flex flex-col items-center gap-3 py-8 text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary-muted)]">
                    <GitHubIcon className="h-5 w-5 text-[var(--primary)]" />
                  </div>
                  <p className="text-sm text-[var(--foreground-muted)]">
                    Connect GitHub to see live activity from your repositories
                  </p>
                  <Link
                    href="/connections"
                    className="text-sm text-[var(--primary)] hover:underline"
                  >
                    Connect GitHub →
                  </Link>
                </div>
              </CardShell>
            )}
          </div>
        </section>

        {/* Operational Health Section */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
            Operational Health
          </h2>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <CostRiskCard report={snapshot.costReport} />
            <SecurityPostureCard posture={securityPosture} />
            <RiskAlertsCard
              alerts={driftAlerts}
              title="Operational Drift"
              description="Authrix watches for docs drift, stalled approvals, and recurring unresolved topics."
              limit={3}
            />
          </div>

          {/* Cost Data Source Placeholders */}
          {(!vercelConnected || !openaiConnected) && (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
              {!vercelConnected && (
                <div className="flex items-center gap-3 rounded-lg border border-dashed border-[var(--border)] bg-[var(--background-elevated)] p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--card)]">
                    <ServerIcon className="h-5 w-5 text-[var(--foreground-muted)]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      Vercel spend tracking
                    </p>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      Add VERCEL_API_TOKEN for live cost data
                    </p>
                  </div>
                  <Link
                    href="/connections"
                    className="text-xs text-[var(--primary)] hover:underline"
                  >
                    Configure →
                  </Link>
                </div>
              )}
              {!openaiConnected && (
                <div className="flex items-center gap-3 rounded-lg border border-dashed border-[var(--border)] bg-[var(--background-elevated)] p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--card)]">
                    <ZapIcon className="h-5 w-5 text-[var(--foreground-muted)]" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-[var(--foreground)]">
                      OpenAI usage tracking
                    </p>
                    <p className="text-xs text-[var(--foreground-muted)]">
                      Add OPENAI_API_KEY for usage data
                    </p>
                  </div>
                  <Link
                    href="/connections"
                    className="text-xs text-[var(--primary)] hover:underline"
                  >
                    Configure →
                  </Link>
                </div>
              )}
            </div>
          )}
        </section>

        {/* Workflow & Approvals Section */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
            Workflow &amp; Approvals
          </h2>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <SuggestedTasksCard tasks={snapshot.tasks} limit={5} />
            <ApprovalQueueCard approvals={snapshot.approvalRequests} limit={5} />
          </div>
        </section>

        {/* Agent Activity Section */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-[var(--foreground-muted)]">
            Agent Activity
          </h2>
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
            <AgentRosterCard />
            <ModelLayerCard status={modelLayerStatus} />
            <OperatorOnboardingCard report={readinessReport} />
          </div>
          <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-2">
            <div className="space-y-6">
              <RuntimeSessionsCard sessions={runtimeSessions} limit={4} />
              <RuntimeRunsCard runs={runtimeRuns} limit={4} />
            </div>
            <div className="space-y-6">
              <ChatActivityCard
                conversations={slackState.conversations}
                dispatches={slackState.dispatches}
              />
              <ChatModelActivityCard
                dispatches={slackState.dispatches}
                briefings={slackState.briefings}
              />
              <ScheduledBriefingsCard
                schedules={slackState.briefingSchedules}
                briefings={slackState.briefings}
              />
              <DelegationHistoryCard delegations={slackState.delegations} />
              <ChatTaskDispatchCard dispatches={slackState.taskDispatches} />
            </div>
          </div>
        </section>
      </div>
    );
  } catch (error) {
    console.error("Dashboard error:", error);
    return (
      <div className="p-8">
        <div className="flex items-center gap-3 mb-4">
          <AlertCircleIcon className="h-6 w-6 text-[var(--danger)]" />
          <h1 className="text-xl font-bold">Dashboard Error</h1>
        </div>
        <div className="rounded-lg border border-[var(--danger-border)] bg-[var(--danger-soft)] p-4">
          <p className="text-sm text-[var(--danger)] mb-2">
            There was an error loading the dashboard. This might be due to:
          </p>
          <ul className="list-disc list-inside text-sm text-[var(--foreground)] space-y-1 ml-2">
            <li>Workspace data corruption</li>
            <li>Missing environment variables</li>
            <li>API connectivity issues</li>
          </ul>
          <pre className="mt-4 bg-[var(--background)] p-4 rounded text-xs overflow-auto border border-[var(--border)]">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </div>
      </div>
    );
  }
}
