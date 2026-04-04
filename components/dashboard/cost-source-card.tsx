import { CardShell } from "@/components/ui/card-shell";
import { StatusPill } from "@/components/ui/status-pill";
import type { CostReport, WorkspacePipelineStatus } from "@/types/domain";

interface CostSourceCardProps {
  report: CostReport;
  pipeline?: WorkspacePipelineStatus;
}

export function CostSourceCard({ report, pipeline }: CostSourceCardProps) {
  return (
    <CardShell
      title="Cost Ingestion"
      description="How Authrix is currently sourcing and evaluating cost data."
      meta={<StatusPill>Report window active</StatusPill>}
    >
      <div className="space-y-3">
        <div className="authrix-row px-4 py-3 text-sm text-[var(--foreground)]">
          <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
            Current report
          </p>
          <p className="mt-2">{new Date(report.generatedAt).toLocaleString()}</p>
          <p className="mt-2 text-xs text-[var(--muted-foreground)]">
            Period: {new Date(report.period.start).toLocaleDateString()} -{" "}
            {new Date(report.period.end).toLocaleDateString()}
          </p>
        </div>
        {pipeline ? (
          <div className="authrix-row px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-[var(--foreground)]">{pipeline.label}</p>
              <span className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background-muted)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                {pipeline.provider}
              </span>
              <StatusPill
                tone={
                  pipeline.health === "ready"
                    ? "success"
                    : pipeline.health === "fallback"
                      ? "warning"
                      : "danger"
                }
                size="sm"
              >
                {pipeline.health}
              </StatusPill>
            </div>
            <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">{pipeline.message}</p>
          </div>
        ) : null}
      </div>
    </CardShell>
  );
}
