import { CardShell } from "@/components/ui/card-shell";
import { EmptyState } from "@/components/ui/empty-state";
import type { CostReport } from "@/types/domain";

interface CostRiskCardProps {
  report: CostReport;
  compact?: boolean;
}

export function CostRiskCard({
  report,
  compact = false,
}: CostRiskCardProps) {
  const riskBadgeClass =
    report.riskLevel === "high"
      ? "bg-red-900/30 text-red-400"
      : report.riskLevel === "medium"
        ? "bg-yellow-900/30 text-yellow-400"
        : "bg-green-900/30 text-green-400";

  return (
    <CardShell
      title="Finance / Ops Risk"
      description="Tracked spend visibility with per-service trends, model/API cost drivers, and anomaly signals."
      badge={
        <span className={`rounded-full px-3 py-1 text-xs ${riskBadgeClass}`}>
          {report.riskLevel} risk
        </span>
      }
    >
      <div className="mb-5 flex items-end gap-3 rounded-[1.4rem] border border-white/8 bg-white/5 px-4 py-4">
        <span className="text-3xl font-semibold text-zinc-50">
          ${report.totalSpend.toFixed(2)}
        </span>
        <span className="text-xs uppercase tracking-wide text-slate-500">
          {report.currency} this week
        </span>
      </div>

      {report.breakdown.length === 0 ? (
        <EmptyState
          title="No spend data available"
          description="Add billing sources or keep using the mock dataset to populate cost reporting."
        />
      ) : (
        <div className="space-y-3">
          {report.breakdown.map((item) => (
            <div
              key={item.service}
              className="flex items-center justify-between rounded-[1.2rem] border border-white/8 bg-slate-950/45 px-4 py-3 text-sm"
            >
              <span className="text-zinc-200">{item.service}</span>
              <div className="flex items-center gap-3">
                <span
                  className={`text-xs ${
                    item.trend === "up"
                      ? "text-red-400"
                      : item.trend === "down"
                        ? "text-green-400"
                        : "text-zinc-500"
                  }`}
                >
                  {item.change > 0 ? "+" : ""}
                  {item.change.toFixed(1)}%
                </span>
                <span className="w-20 text-right font-medium text-zinc-200">
                  ${item.amount.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!compact ? (
        <div className="mt-5">
          <p className="text-sm leading-6 text-slate-300/90">{report.summary}</p>
          {report.anomalies.length > 0 ? (
            <div className="mt-4 space-y-3">
              {report.anomalies.map((anomaly) => (
                <div
                  key={`${anomaly.service}-${anomaly.detectedAt}`}
                  className={`rounded-xl border px-4 py-3 text-sm ${
                    anomaly.severity === "high"
                      ? "border-red-800/30 bg-red-900/10 text-red-300"
                      : anomaly.severity === "medium"
                        ? "border-yellow-800/30 bg-yellow-900/10 text-yellow-300"
                        : "border-zinc-700/30 bg-zinc-800/50 text-zinc-400"
                  }`}
                >
                  <div className="font-medium">{anomaly.service}</div>
                  <p className="mt-1 text-xs leading-5 opacity-90">
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
