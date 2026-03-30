import { CardShell } from "@/components/ui/card-shell";
import { EmptyState } from "@/components/ui/empty-state";
import type { EngineeringSummary } from "@/types/domain";

interface WeeklySummaryCardProps {
  summary: EngineeringSummary;
}

export function WeeklySummaryCard({ summary }: WeeklySummaryCardProps) {
  const hasHighlights =
    summary.activityCount > 0 ||
    summary.repoBreakdown.length > 0 ||
    summary.contributorBreakdown.length > 0;
  const topRepos = summary.repoBreakdown.slice(0, 3);

  return (
    <CardShell
      title="Weekly Summary"
      description="Structured engineering intelligence generated from normalized activity."
    >
      {!hasHighlights ? (
        <EmptyState
          title="No engineering activity yet"
          description="Connect a repository or load mock events to generate the first weekly summary."
        />
      ) : (
        <>
          <div className="rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-sm leading-7 text-slate-200/95">{summary.overallSummary}</p>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <MetricTile label="Events" value={summary.activityCount} />
            <MetricTile label="Repos" value={summary.repoBreakdown.length} />
            <MetricTile label="Contributors" value={summary.contributorBreakdown.length} />
          </div>
          {topRepos.length > 0 ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {topRepos.map((repo) => (
                <span
                  key={repo.repo}
                  className="rounded-full border border-cyan-300/15 bg-cyan-300/8 px-3 py-1 text-[11px] uppercase tracking-[0.16em] text-cyan-100/75"
                >
                  {repo.repo}
                </span>
              ))}
            </div>
          ) : null}
          {summary.riskFlags.length > 0 ? (
            <div className="mt-5 space-y-2">
              {summary.riskFlags.map((flag) => (
                <div
                  key={flag.title}
                  className="rounded-xl border border-yellow-800/30 bg-yellow-900/16 px-3 py-2 text-xs text-yellow-200"
                >
                  {flag.title}
                </div>
              ))}
            </div>
          ) : null}
        </>
      )}
    </CardShell>
  );
}

function MetricTile({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-[1.2rem] border border-white/8 bg-slate-950/45 px-4 py-3">
      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-50">{value}</p>
    </div>
  );
}
