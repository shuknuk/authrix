import type { CostReport } from "@/types/domain";

async function fetchCosts(): Promise<CostReport> {
  const res = await fetch("http://localhost:3000/api/agents/costs", {
    cache: "no-store",
  });
  return res.json();
}

export default async function CostsPage() {
  const report = await fetchCosts();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Costs</h2>

      {/* Summary */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <div className="flex items-baseline gap-3 mb-4">
          <span className="text-3xl font-bold">
            ${report.totalSpend.toFixed(2)}
          </span>
          <span className="text-sm text-zinc-500">
            {report.currency} this week
          </span>
          <span
            className={`ml-auto text-sm px-3 py-1 rounded ${
              report.riskLevel === "high"
                ? "bg-red-900/30 text-red-400"
                : report.riskLevel === "medium"
                  ? "bg-yellow-900/30 text-yellow-400"
                  : "bg-green-900/30 text-green-400"
            }`}
          >
            {report.riskLevel} risk
          </span>
        </div>
        <p className="text-sm text-zinc-400">{report.summary}</p>
      </div>

      {/* Breakdown */}
      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
        <h3 className="text-sm font-medium text-zinc-400 mb-4">
          Service Breakdown
        </h3>
        <div className="space-y-3">
          {report.breakdown.map((item) => (
            <div
              key={item.service}
              className="flex items-center justify-between"
            >
              <span className="text-sm text-zinc-300">{item.service}</span>
              <div className="flex items-center gap-4">
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
                <span className="text-sm font-medium text-zinc-200 w-20 text-right">
                  ${item.amount.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Anomalies */}
      {report.anomalies.length > 0 && (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-4">
            Anomalies Detected
          </h3>
          <div className="space-y-3">
            {report.anomalies.map((anomaly, i) => (
              <div
                key={i}
                className={`text-sm px-4 py-3 rounded border ${
                  anomaly.severity === "high"
                    ? "bg-red-900/10 border-red-800/30 text-red-300"
                    : anomaly.severity === "medium"
                      ? "bg-yellow-900/10 border-yellow-800/30 text-yellow-300"
                      : "bg-zinc-800/50 border-zinc-700/30 text-zinc-400"
                }`}
              >
                <div className="font-medium">{anomaly.service}</div>
                <p className="text-xs mt-1 opacity-80">
                  {anomaly.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
