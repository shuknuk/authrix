import { CardShell } from "@/components/ui/card-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
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
  const highestSeverity = visibleAlerts.some((alert) => alert.severity === "high")
    ? "danger"
    : visibleAlerts.some((alert) => alert.severity === "medium")
      ? "warning"
      : "default";

  return (
    <CardShell
      title={title}
      description={description}
      tone={highestSeverity}
      actions={
        visibleAlerts.length > 0 ? (
          <StatusPill tone={highestSeverity === "danger" ? "danger" : highestSeverity === "warning" ? "warning" : "neutral"}>
            {visibleAlerts.length} active
          </StatusPill>
        ) : null
      }
    >
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
              className="rounded-[var(--radius-sm)] border px-4 py-3"
              style={{
                borderColor:
                  alert.severity === "high"
                    ? "color-mix(in srgb, var(--danger) 20%, transparent)"
                    : alert.severity === "medium"
                      ? "color-mix(in srgb, var(--warning) 20%, transparent)"
                      : "var(--border)",
                background:
                  alert.severity === "high"
                    ? "color-mix(in srgb, var(--danger) 6%, transparent)"
                    : alert.severity === "medium"
                      ? "color-mix(in srgb, var(--warning) 6%, transparent)"
                      : "var(--background)",
              }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-[var(--foreground)]">{alert.title}</p>
                <span className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background-muted)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  {alert.severity}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">{alert.description}</p>
            </div>
          ))}
        </div>
      )}
    </CardShell>
  );
}
