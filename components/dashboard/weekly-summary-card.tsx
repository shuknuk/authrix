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
          <p className="text-sm leading-7 text-zinc-300">
            {summary.overallSummary}
          </p>
          <div className="mt-4 flex flex-wrap gap-3 text-xs text-zinc-500">
            <span>{summary.activityCount} events</span>
            <span>{summary.repoBreakdown.length} repos</span>
            <span>{summary.contributorBreakdown.length} contributors</span>
          </div>
          {summary.riskFlags.length > 0 ? (
            <div className="mt-5 space-y-2">
              {summary.riskFlags.map((flag) => (
                <div
                  key={flag.title}
                  className="rounded-xl border border-yellow-800/30 bg-yellow-900/20 px-3 py-2 text-xs text-yellow-300"
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
