import { CardShell } from "@/components/ui/card-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import type { CostReport } from "@/types/domain";

interface CostRiskCardProps {
  report: CostReport;
  compact?: boolean;
}

function riskTone(level: CostReport["riskLevel"]) {
  if (level === "high") {
    return "danger" as const;
  }

  if (level === "medium") {
    return "warning" as const;
  }

  return "success" as const;
}

export function CostRiskCard({
  report,
  compact = false,
}: CostRiskCardProps) {
  return (
    <CardShell
      title="API Spend / Risk"
      description="Weekly spend posture with breakdown and anomaly context."
      tone={riskTone(report.riskLevel) === "success" ? "default" : riskTone(report.riskLevel)}
      meta={
        <>
          <StatusPill>{report.currency}</StatusPill>
          <StatusPill tone="info">Updated {new Date(report.generatedAt).toLocaleDateString()}</StatusPill>
        </>
      }
      actions={<StatusPill tone={riskTone(report.riskLevel)}>{report.riskLevel} risk</StatusPill>}
    >
      <p className="text-4xl font-semibold text-[var(--foreground-strong)]">
        ${report.totalSpend.toFixed(2)}
      </p>

      {report.breakdown.length === 0 ? (
        <div className="mt-4">
          <EmptyState
            title="No spend data available"
            description="Keep mock cost data on, or connect billing sources to populate this report."
          />
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-[12px] border border-[var(--border)] bg-[var(--background)]">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                <th className="px-4 py-3 font-medium">Service</th>
                <th className="px-4 py-3 font-medium">Change</th>
                <th className="px-4 py-3 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {report.breakdown.map((item) => (
                <tr key={item.service} className="border-t border-[var(--border)] first:border-t-0">
                  <td className="px-4 py-3 font-medium text-[var(--foreground)]">{item.service}</td>
                  <td
                    className={`px-4 py-3 text-xs ${
                      item.trend === "up"
                        ? "text-[var(--danger)]"
                        : item.trend === "down"
                          ? "text-[var(--success)]"
                          : "text-[var(--muted-foreground)]"
                    }`}
                  >
                    {item.change > 0 ? "+" : ""}
                    {item.change.toFixed(1)}%
                  </td>
                  <td className="px-4 py-3 text-sm text-[var(--foreground)]">${item.amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!compact ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm leading-6 text-[var(--muted-foreground)]">{report.summary}</p>
          {report.anomalies.length > 0 ? (
            <div className="space-y-2">
              {report.anomalies.map((anomaly) => (
                <div
                  key={`${anomaly.service}-${anomaly.detectedAt}`}
                  className="rounded-[10px] border px-3 py-2.5"
                  style={{
                    borderColor:
                      anomaly.severity === "high"
                        ? "var(--danger-border)"
                        : anomaly.severity === "medium"
                          ? "var(--warning-border)"
                          : "var(--border)",
                    background:
                      anomaly.severity === "high"
                        ? "var(--danger-soft)"
                        : anomaly.severity === "medium"
                          ? "var(--warning-soft)"
                          : "var(--background)",
                  }}
                >
                  <p className="text-sm font-medium text-[var(--foreground)]">{anomaly.service}</p>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                    {anomaly.description}
                  </p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </CardShell>
  );
}
