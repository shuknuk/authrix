import { CardFrame } from "@/components/cards/card-frame";
import { StatusBadge } from "@/components/ui/status-badge";
import type { WeeklySummary } from "@/types/authrix";

export function WeeklySummaryCard({
  summary,
  status = "ready",
}: {
  summary?: WeeklySummary;
  status?: "ready" | "loading" | "empty" | "error";
}) {
  return (
    <CardFrame
      eyebrow="Engineer agent"
      title="Weekly Summary"
      description="Structured weekly engineering summary generated from normalized GitHub activity."
      status={status}
      emptyMessage="Connect GitHub or load the mock feed to generate a weekly summary."
      errorMessage="The engineer agent could not produce a summary."
    >
      {summary ? (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <p className="text-lg font-semibold leading-8 text-foreground">
              {summary.headline}
            </p>
            <StatusBadge
              tone={
                summary.momentum === "high"
                  ? "success"
                  : summary.momentum === "steady"
                    ? "accent"
                    : "warning"
              }
            >
              {summary.momentum}
            </StatusBadge>
          </div>
          <p className="text-sm leading-7 text-muted">{summary.overview}</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.25rem] bg-[rgba(17,33,50,0.04)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                Focus areas
              </p>
              <ul className="mt-3 space-y-2 text-sm text-foreground">
                {summary.focusAreas.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-[1.25rem] bg-[rgba(17,33,50,0.04)] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
                Metrics
              </p>
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm text-foreground">
                <div>
                  <p className="text-2xl font-semibold">
                    {summary.metrics.mergedPullRequests}
                  </p>
                  <p className="text-muted">Merged PRs</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">{summary.metrics.commits}</p>
                  <p className="text-muted">Commits</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {summary.metrics.issuesClosed}
                  </p>
                  <p className="text-muted">Issues closed</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">
                    {summary.metrics.activeRepos}
                  </p>
                  <p className="text-muted">Active repos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </CardFrame>
  );
}
