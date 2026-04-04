import { CardShell } from "@/components/ui/card-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { MetricTile } from "@/components/ui/metric-tile";
import { SignalList } from "@/components/ui/signal-list";
import { StatusPill } from "@/components/ui/status-pill";
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
      description="Structured review assembled from normalized engineering activity."
      tone="accent"
      meta={
        <>
          <StatusPill tone="info">{new Date(summary.generatedAt).toLocaleDateString()}</StatusPill>
          <StatusPill>
            {new Date(summary.period.start).toLocaleDateString()} to{" "}
            {new Date(summary.period.end).toLocaleDateString()}
          </StatusPill>
        </>
      }
    >
      {!hasHighlights ? (
        <EmptyState
          title="No engineering activity yet"
          description="Connect GitHub or keep mock activity enabled to generate the first weekly summary."
        />
      ) : (
        <div className="space-y-5">
          <p className="rounded-[12px] border border-[var(--border)] bg-[var(--background)] px-4 py-4 text-sm leading-7 text-[var(--foreground)]">
            {summary.overallSummary}
          </p>

          <div className="grid gap-4 border-y border-[var(--border)] py-4 sm:grid-cols-3">
            <MetricTile label="Events" value={summary.activityCount} tone="accent" />
            <MetricTile label="Repositories" value={summary.repoBreakdown.length} />
            <MetricTile label="Contributors" value={summary.contributorBreakdown.length} />
          </div>

          {summary.riskFlags.length > 0 ? (
            <SignalList
              items={summary.riskFlags.map((flag) => ({
                id: flag.title,
                title: flag.title,
                description: flag.description,
                meta: flag.severity,
                tone:
                  flag.severity === "high"
                    ? "danger"
                    : flag.severity === "medium"
                      ? "warning"
                      : "neutral",
              }))}
            />
          ) : null}
        </div>
      )}
    </CardShell>
  );
}
