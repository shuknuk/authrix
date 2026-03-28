import { CardShell } from "@/components/ui/card-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { PageHeader } from "@/components/ui/page-header";
import { getIntegrationStatuses } from "@/lib/data/workspace";

export default async function ConnectionsPage() {
  const integrations = await getIntegrationStatuses();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Connections"
        description="Manage external systems that Authrix can observe or act on through a mediated backend layer."
      />

      <CardShell
        title="Integration Status"
        description="Agents never hold raw credentials. All third-party access is routed through controlled backend adapters."
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
                className="flex items-center justify-between rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3"
              >
                <div>
                  <p className="text-sm font-medium text-zinc-200">
                    {integration.service}
                  </p>
                  {integration.connected && integration.scopes ? (
                    <p className="mt-1 text-xs text-zinc-500">
                      Scopes: {integration.scopes.join(", ")}
                    </p>
                  ) : (
                    <p className="mt-1 text-xs text-zinc-500">
                      Waiting for delegated access.
                    </p>
                  )}
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
                  {integration.connected ? "Connected" : "Not connected"}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardShell>
    </div>
  );
}
