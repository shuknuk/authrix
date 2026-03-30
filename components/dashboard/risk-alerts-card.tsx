import { CardShell } from "@/components/ui/card-shell";
import { EmptyState } from "@/components/ui/empty-state";
import type { RiskAlert } from "@/types/domain";

interface RiskAlertsCardProps {
  alerts: RiskAlert[];
  title?: string;
  description?: string;
  limit?: number;
}

export function RiskAlertsCard({
  alerts,
  title = "Risk Alerts",
  description = "Current risk signals detected by Authrix.",
  limit,
}: RiskAlertsCardProps) {
  const visibleAlerts = typeof limit === "number" ? alerts.slice(0, limit) : alerts;

  return (
    <CardShell title={title} description={description}>
      {visibleAlerts.length === 0 ? (
        <EmptyState
          title="No active alerts"
          description="Authrix has not detected any issues in this category right now."
        />
      ) : (
        <div className="space-y-3">
          {visibleAlerts.map((alert) => (
            <div
              key={alert.id}
              className={`rounded-xl border px-4 py-3 ${
                alert.severity === "high"
                  ? "border-red-800/40 bg-red-900/10"
                  : alert.severity === "medium"
                    ? "border-yellow-800/40 bg-yellow-900/10"
                    : "border-zinc-800/80 bg-zinc-950/60"
              }`}
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-zinc-200">{alert.title}</p>
                <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  {alert.severity}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-zinc-400">{alert.description}</p>
            </div>
          ))}
        </div>
      )}
    </CardShell>
  );
}
