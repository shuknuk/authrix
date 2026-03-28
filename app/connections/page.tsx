import type { IntegrationStatus } from "@/types/domain";

// MOCK: will be replaced by real integration state
const mockIntegrations: IntegrationStatus[] = [
  {
    service: "GitHub",
    connected: true,
    connectedAt: "2026-03-20T10:00:00Z",
    scopes: ["repo", "read:org"],
    status: "active",
  },
  {
    service: "Vercel",
    connected: false,
    status: "inactive",
  },
  {
    service: "Supabase",
    connected: false,
    status: "inactive",
  },
  {
    service: "Slack",
    connected: false,
    status: "inactive",
  },
];

export default function ConnectionsPage() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Connections</h2>
      <p className="text-sm text-zinc-500">
        Manage external integrations. Agents access these services through a
        mediated backend layer — they never hold raw credentials.
      </p>

      <div className="space-y-3">
        {mockIntegrations.map((integration) => (
          <div
            key={integration.service}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 flex items-center justify-between"
          >
            <div>
              <p className="text-sm font-medium text-zinc-200">
                {integration.service}
              </p>
              {integration.connected && integration.scopes && (
                <p className="text-xs text-zinc-500 mt-1">
                  Scopes: {integration.scopes.join(", ")}
                </p>
              )}
            </div>
            <span
              className={`text-xs px-3 py-1 rounded ${
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
    </div>
  );
}
