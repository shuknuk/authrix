import type {
  EngineeringSummary,
  SuggestedTask,
  CostReport,
  ApprovalRequest,
} from "@/types/domain";

async function fetchSummary(): Promise<EngineeringSummary> {
  const res = await fetch("http://localhost:3000/api/agents/summary", {
    cache: "no-store",
  });
  return res.json();
}

async function fetchTasks(): Promise<SuggestedTask[]> {
  const res = await fetch("http://localhost:3000/api/agents/tasks", {
    cache: "no-store",
  });
  return res.json();
}

async function fetchCosts(): Promise<CostReport> {
  const res = await fetch("http://localhost:3000/api/agents/costs", {
    cache: "no-store",
  });
  return res.json();
}

async function fetchApprovals(): Promise<ApprovalRequest[]> {
  const res = await fetch("http://localhost:3000/api/approvals", {
    cache: "no-store",
  });
  return res.json();
}

export default async function DashboardPage() {
  const [summary, tasks, costs, approvals] = await Promise.all([
    fetchSummary(),
    fetchTasks(),
    fetchCosts(),
    fetchApprovals(),
  ]);

  const pendingApprovals = approvals.filter((a) => a.status === "pending");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Summary */}
        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-3">
            Weekly Summary
          </h3>
          <p className="text-sm text-zinc-300 leading-relaxed">
            {summary.overallSummary}
          </p>
          <div className="mt-4 flex gap-4 text-xs text-zinc-500">
            <span>{summary.activityCount} events</span>
            <span>{summary.repoBreakdown.length} repos</span>
            <span>{summary.contributorBreakdown.length} contributors</span>
          </div>
          {summary.riskFlags.length > 0 && (
            <div className="mt-4 space-y-2">
              {summary.riskFlags.map((flag, i) => (
                <div
                  key={i}
                  className="text-xs px-3 py-2 rounded bg-yellow-900/20 border border-yellow-800/30 text-yellow-300"
                >
                  {flag.title}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Suggested Tasks */}
        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-3">
            Suggested Tasks
          </h3>
          <div className="space-y-3">
            {tasks.slice(0, 5).map((task) => (
              <div
                key={task.id}
                className="flex items-start gap-3 text-sm"
              >
                <span
                  className={`mt-0.5 inline-block w-2 h-2 rounded-full shrink-0 ${
                    task.priority === "critical"
                      ? "bg-red-500"
                      : task.priority === "high"
                        ? "bg-orange-500"
                        : task.priority === "medium"
                          ? "bg-yellow-500"
                          : "bg-zinc-500"
                  }`}
                />
                <div>
                  <p className="text-zinc-200">{task.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {task.source}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Cost / Risk */}
        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-3">
            API Spend / Risk
          </h3>
          <div className="flex items-baseline gap-2 mb-4">
            <span className="text-2xl font-bold">
              ${costs.totalSpend.toFixed(2)}
            </span>
            <span className="text-xs text-zinc-500">{costs.currency} this week</span>
            <span
              className={`ml-auto text-xs px-2 py-0.5 rounded ${
                costs.riskLevel === "high"
                  ? "bg-red-900/30 text-red-400"
                  : costs.riskLevel === "medium"
                    ? "bg-yellow-900/30 text-yellow-400"
                    : "bg-green-900/30 text-green-400"
              }`}
            >
              {costs.riskLevel} risk
            </span>
          </div>
          <div className="space-y-2">
            {costs.breakdown.map((item) => (
              <div
                key={item.service}
                className="flex justify-between text-xs"
              >
                <span className="text-zinc-400">{item.service}</span>
                <span className="text-zinc-300">
                  ${item.amount.toFixed(2)}
                  {item.change !== 0 && (
                    <span
                      className={
                        item.trend === "up"
                          ? " text-red-400"
                          : item.trend === "down"
                            ? " text-green-400"
                            : " text-zinc-500"
                      }
                    >
                      {" "}
                      {item.change > 0 ? "+" : ""}
                      {item.change.toFixed(1)}%
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* Approval Queue */}
        <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-6">
          <h3 className="text-sm font-medium text-zinc-400 mb-3">
            Approval Queue
            {pendingApprovals.length > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-orange-600 text-[10px] text-white font-bold">
                {pendingApprovals.length}
              </span>
            )}
          </h3>
          <div className="space-y-3">
            {approvals.slice(0, 5).map((a) => (
              <div
                key={a.id}
                className="flex items-start justify-between text-sm"
              >
                <div>
                  <p className="text-zinc-200">{a.title}</p>
                  <p className="text-xs text-zinc-500 mt-0.5">
                    {a.sourceAgent} &middot; {a.affectedSystem}
                  </p>
                </div>
                <span
                  className={`text-xs px-2 py-0.5 rounded shrink-0 ${
                    a.status === "pending"
                      ? "bg-orange-900/30 text-orange-400"
                      : a.status === "approved"
                        ? "bg-green-900/30 text-green-400"
                        : "bg-red-900/30 text-red-400"
                  }`}
                >
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
