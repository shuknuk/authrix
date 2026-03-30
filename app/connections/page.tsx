import { CardShell } from "@/components/ui/card-shell";
import { DeploymentReadinessCard } from "@/components/dashboard/deployment-readiness-card";
import { DeploymentSmokeTestCard } from "@/components/dashboard/deployment-smoke-test-card";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
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
import { getRuntimeBridge } from "@/lib/runtime/bridge";
import { getSecurityPosture } from "@/lib/security/status";
import { SecurityPostureCard } from "@/components/dashboard/security-posture-card";
import { listSecurityEvents } from "@/lib/security/events";
import { SecurityEventsCard } from "@/components/dashboard/security-events-card";
import { OperatorOnboardingCard } from "@/components/dashboard/operator-onboarding-card";
import { SlackSetupCard } from "@/components/dashboard/slack-setup-card";
import { ModelLayerCard } from "@/components/dashboard/model-layer-card";
import { getModelLayerStatus } from "@/lib/models/provider";

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
    listSecurityEvents(6),
    getDeploymentReadinessReport(),
    runDeploymentSmokeTest(),
    Promise.resolve(getModelLayerStatus()),
  ]);
  const integrations = snapshot.integrations;
  const githubConnectionName = getGitHubConnectionName();
  const githubConnectHref = githubConnectionName
    ? buildGitHubConnectHref(githubConnectionName, getGitHubConnectionScopes())
    : null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Connections"
        description="Manage delegated access, runtime posture, and the bring-up path that turns Authrix into a real startup worker system."
      />

      <OperatorOnboardingCard report={readinessReport} />
      <SecurityPostureCard posture={securityPosture} />
      <DeploymentReadinessCard report={readinessReport} />
      <DeploymentSmokeTestCard report={smokeReport} />
      <SlackSetupCard />
      <ModelLayerCard status={modelLayerStatus} />

      <CardShell
        title="Autonomous Runtime"
        description="Authrix runs on an internal autonomous runtime engine. The product layer stays cleanly separated so runtime internals remain an implementation detail."
      >
        <div className="flex items-start justify-between gap-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-zinc-200">Runtime engine</p>
              <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                {formatRuntimeProvider(runtimeStatus.provider)}
              </span>
            </div>
            <p className="mt-1 text-xs text-zinc-500">{runtimeStatus.description}</p>
            {runtimeStatus.url ? (
              <p className="mt-2 text-[11px] text-zinc-600">
                Runtime endpoint: {runtimeStatus.url}
              </p>
            ) : null}
            {runtimeStatus.agentId ? (
              <p className="mt-2 text-[11px] text-zinc-600">
                Default runtime worker: {runtimeStatus.agentId}
              </p>
            ) : null}
            {runtimeStatus.availableMethods && runtimeStatus.availableMethods.length > 0 ? (
              <p className="mt-2 text-[11px] text-zinc-600">
                Available methods: {runtimeStatus.availableMethods.length}
              </p>
            ) : null}
            <p className="mt-2 text-[11px] text-zinc-600">
              Connect scopes: {securityPosture.runtimeConnectScopes.join(", ")}
            </p>
            <p className="mt-2 text-[11px] text-zinc-600">
              Tool policy: {runtimeStatus.toolPolicy?.mode ?? "unknown"}
            </p>
          </div>
          <span
            className={`rounded-full px-3 py-1 text-xs ${
              runtimeStatus.mode === "live"
                ? "bg-green-900/30 text-green-400"
                : runtimeStatus.mode === "mock"
                  ? "bg-zinc-800 text-zinc-400"
                  : "bg-amber-900/30 text-amber-400"
            }`}
          >
            {runtimeStatus.mode === "live"
              ? "Live"
              : runtimeStatus.mode === "mock"
                ? "Mock"
                : "Disconnected"}
          </span>
        </div>
      </CardShell>

      <CardShell
        title="Product State"
        description="This is the persisted backend state that powers the control tower. Pipeline health is shown honestly so fallback paths stay visible."
      >
        <div className="space-y-3">
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3 text-xs text-zinc-400">
            <p>Storage: {snapshot.state.storage}</p>
            <p className="mt-2">
              Last refreshed: {new Date(snapshot.state.refreshedAt).toLocaleString()}
            </p>
            <p className="mt-2">
              Last persisted: {new Date(snapshot.state.persistedAt).toLocaleString()}
            </p>
          </div>
          {snapshot.state.pipelines.map((pipeline) => (
            <div
              key={pipeline.id}
              className="flex items-start justify-between gap-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-medium text-zinc-200">{pipeline.label}</p>
                  <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                    {formatRuntimeProvider(pipeline.provider)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-500">{pipeline.message}</p>
                <p className="mt-2 text-[11px] text-zinc-600">
                  Updated {new Date(pipeline.updatedAt).toLocaleString()}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs ${
                  pipeline.health === "ready"
                    ? "bg-green-900/30 text-green-400"
                    : pipeline.health === "fallback"
                      ? "bg-amber-900/30 text-amber-400"
                      : "bg-red-900/30 text-red-400"
                }`}
              >
                {pipeline.health}
              </span>
            </div>
          ))}
        </div>
      </CardShell>

      <CardShell
        title="Integration Status"
        description="Agents never hold raw credentials. All third-party access and professional messaging surfaces are routed through controlled backend adapters."
      >
        {integrations.length === 0 ? (
          <EmptyState
            title="No integrations configured"
            description="Connect GitHub first, then expand into the rest of the workspace as the product grows."
          />
        ) : (
          <div className="space-y-3">
            {integrations.map((integration) => (
              <div
                key={integration.service}
                className="flex items-start justify-between gap-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-zinc-200">
                      {integration.service}
                    </p>
                    {integration.mode ? (
                      <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                        {integration.mode}
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    {integration.description ??
                      (integration.connected
                        ? "Delegated access is available."
                        : "Waiting for delegated access.")}
                  </p>
                  {integration.scopes && integration.scopes.length > 0 ? (
                    <p className="mt-2 text-[11px] text-zinc-600">
                      Scopes: {integration.scopes.join(", ")}
                    </p>
                  ) : null}
                  {integration.lastSyncedAt ? (
                    <p className="mt-2 text-[11px] text-zinc-600">
                      Last sync:{" "}
                      {new Date(integration.lastSyncedAt).toLocaleString()}
                    </p>
                  ) : null}
                  {integration.service === "GitHub" && githubConnectHref ? (
                    <div className="mt-3 flex flex-wrap gap-3">
                      {integration.mode !== "token-vault" ? (
                        <a
                          href={githubConnectHref}
                          className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800"
                        >
                          Connect GitHub With Auth0
                        </a>
                      ) : (
                        <span className="inline-flex items-center rounded-full border border-green-800/50 bg-green-900/20 px-3 py-1.5 text-xs font-medium text-green-300">
                          Delegated GitHub access active
                        </span>
                      )}
                    </div>
                  ) : null}
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs ${
                    integration.status === "active"
                      ? "bg-green-900/30 text-green-400"
                      : integration.status === "error"
                        ? "bg-red-900/30 text-red-400"
                        : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  {integration.status === "error"
                    ? "Fallback"
                    : integration.connected
                      ? "Connected"
                      : integration.mode === "mock"
                        ? "Mock"
                        : "Not connected"}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardShell>

      <SecurityEventsCard events={securityEvents} limit={6} />
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
