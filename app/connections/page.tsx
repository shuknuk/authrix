import { DeploymentReadinessCard } from "@/components/dashboard/deployment-readiness-card";
import { DeploymentSmokeTestCard } from "@/components/dashboard/deployment-smoke-test-card";
import { ModelLayerCard } from "@/components/dashboard/model-layer-card";
import { OperatorOnboardingCard } from "@/components/dashboard/operator-onboarding-card";
import { SecurityEventsCard } from "@/components/dashboard/security-events-card";
import { SecurityPostureCard } from "@/components/dashboard/security-posture-card";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricTile } from "@/components/ui/metric-tile";
import { PageHeader } from "@/components/ui/page-header";
import { SectionFrame } from "@/components/ui/section-frame";
import { StatusPill } from "@/components/ui/status-pill";
import {
  getGitHubConnectionName,
  getGitHubConnectionScopes,
} from "@/lib/auth/token-vault";
import { requireSession } from "@/lib/auth/session";
import { getWorkspaceSnapshot } from "@/lib/data/workspace";
import {
  getDeploymentReadinessReport,
  runDeploymentSmokeTest,
} from "@/lib/deployment/readiness";
import { getModelLayerStatus } from "@/lib/models/provider";
import { getRuntimeBridge } from "@/lib/runtime/bridge";
import { listSecurityEvents } from "@/lib/security/events";
import { getSecurityPosture } from "@/lib/security/status";

export default async function ConnectionsPage() {
  await requireSession("/connections");

  const [
    snapshot,
    runtimeStatus,
    securityPosture,
    securityEvents,
    readinessReport,
    smokeReport,
    modelLayerStatus,
  ] = await Promise.all([
    getWorkspaceSnapshot(),
    getRuntimeBridge().getStatus(),
    Promise.resolve(getSecurityPosture()),
    listSecurityEvents(8),
    getDeploymentReadinessReport(),
    runDeploymentSmokeTest(),
    Promise.resolve(getModelLayerStatus()),
  ]);

  const integrations = snapshot.integrations;
  const connectedIntegrations = integrations.filter((integration) => integration.connected).length;
  const githubConnectionName = getGitHubConnectionName();
  const githubConnectHref = githubConnectionName
    ? buildGitHubConnectHref(githubConnectionName, getGitHubConnectionScopes())
    : null;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Connections"
        eyebrow="Authrix Control Plane"
        description="Delegated access, runtime posture, and worker-box readiness for the demo workspace."
        status={
          <>
            <StatusPill tone={runtimeStatus.mode === "live" ? "success" : "warning"}>
              Runtime {runtimeStatus.mode}
            </StatusPill>
            <StatusPill tone={securityPosture.externalWritesEnabled ? "warning" : "success"}>
              {securityPosture.externalWritesEnabled ? "Writes enabled" : "Writes blocked"}
            </StatusPill>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile
          label="Connected systems"
          value={connectedIntegrations}
          tone={connectedIntegrations > 0 ? "success" : "warning"}
        />
        <MetricTile
          label="Security events"
          value={securityEvents.length}
          tone={securityEvents.length > 0 ? "warning" : "success"}
        />
        <MetricTile label="Pipelines visible" value={snapshot.state.pipelines.length} tone="accent" />
      </div>

      <SectionFrame
        title="Delegated Access"
        description="Connection status and runtime details are shown before any bring-up internals."
      >
        {integrations.length === 0 ? (
          <EmptyState
            title="No integrations configured"
            description="Connect GitHub first to start generating reviewable weekly output."
          />
        ) : (
          <div className="overflow-x-auto rounded-[12px] border border-[var(--border)] bg-[var(--background)]">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                  <th className="px-4 py-3 font-medium">System</th>
                  <th className="px-4 py-3 font-medium">Mode</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {integrations.map((integration) => (
                  <tr key={integration.service} className="border-t border-[var(--border)] first:border-t-0">
                    <td className="px-4 py-3 font-medium text-[var(--foreground-strong)]">
                      {integration.service}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">
                      {integration.mode ?? "n/a"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill
                        tone={
                          integration.status === "active"
                            ? "success"
                            : integration.status === "error"
                              ? "danger"
                              : "neutral"
                        }
                        size="sm"
                      >
                        {integration.connected ? "Connected" : "Needs setup"}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-3 text-xs leading-5 text-[var(--muted-foreground)]">
                      {integration.description ?? "Delegated adapter routing enabled."}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="rounded-[12px] border border-[var(--border)] bg-[var(--background-elevated)] px-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-[var(--foreground-strong)]">Runtime bridge</p>
            <StatusPill size="sm">{formatRuntimeProvider(runtimeStatus.provider)}</StatusPill>
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--muted-foreground)]">
            {runtimeStatus.description}
          </p>
          {runtimeStatus.url ? (
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">Endpoint: {runtimeStatus.url}</p>
          ) : null}
          {githubConnectHref ? (
            <a
              href={githubConnectHref}
              className="mt-3 inline-flex rounded-full border border-[var(--primary-border)] bg-[var(--primary)] px-4 py-1.5 text-xs font-medium text-[var(--primary-foreground)] hover:opacity-90"
            >
              Connect GitHub with Auth0
            </a>
          ) : null}
        </div>
      </SectionFrame>

      <SectionFrame
        title="Bring-up"
        description="Worker-box checklist and smoke test keep the demo posture explicit."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <OperatorOnboardingCard report={readinessReport} />
          <DeploymentReadinessCard report={readinessReport} />
          <div className="xl:col-span-2">
            <DeploymentSmokeTestCard report={smokeReport} />
          </div>
        </div>
      </SectionFrame>

      <SectionFrame
        title="Security And Model Layer"
        description="Guardrails, recent policy events, and model routing posture for operator review."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <SecurityPostureCard posture={securityPosture} />
          <ModelLayerCard status={modelLayerStatus} />
          <div className="xl:col-span-2">
            <SecurityEventsCard events={securityEvents} limit={8} />
          </div>
        </div>
      </SectionFrame>
    </div>
  );
}

function buildGitHubConnectHref(connectionName: string, scopes: string[]): string {
  const params = new URLSearchParams({
    connection: connectionName,
    returnTo: "/connections",
  });

  scopes.forEach((scope) => params.append("scopes", scope));

  return `/auth/connect?${params.toString()}`;
}

function formatRuntimeProvider(provider: string): string {
  if (provider === "openclaw") {
    return "internal";
  }

  return provider;
}
