import { CardShell } from "@/components/ui/card-shell";
import { getFinanceReportMetadata } from "@/lib/finance/ingestion";
import type { CostReport, WorkspacePipelineStatus } from "@/types/domain";

interface CostSourceCardProps {
  report: CostReport;
  pipeline?: WorkspacePipelineStatus;
}

export function CostSourceCard({ report, pipeline }: CostSourceCardProps) {
  const financeMetadata = getFinanceReportMetadata(report);

  return (
    <CardShell
      title="Finance Sources"
      description="How Authrix is currently sourcing billing data and deciding whether the finance path is live or fallback."
      badge={
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-400">
          {financeMetadata.sourceMode}
        </span>
      }
    >
      <div className="space-y-3">
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3 text-sm text-zinc-300">
          <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
            Current report
          </p>
          <p className="mt-2">{new Date(report.generatedAt).toLocaleString()}</p>
          <p className="mt-2 text-xs text-zinc-500">
            Period: {new Date(report.period.start).toLocaleDateString()} -{" "}
            {new Date(report.period.end).toLocaleDateString()}
          </p>
          {financeMetadata.ingestionMessage ? (
            <p className="mt-3 text-xs leading-5 text-zinc-500">
              {financeMetadata.ingestionMessage}
            </p>
          ) : null}
        </div>
        {pipeline ? (
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-medium text-zinc-200">{pipeline.label}</p>
              <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                {pipeline.provider}
              </span>
              <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                {pipeline.health}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-zinc-500">{pipeline.message}</p>
          </div>
        ) : null}
        {financeMetadata.sources.length > 0 ? (
          financeMetadata.sources.slice(0, 5).map((source) => (
            <div
              key={source.id}
              className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-zinc-200">{source.service}</p>
                <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  {source.mode}
                </span>
                <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-zinc-400">
                  ${source.amount.toFixed(2)}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-zinc-500">
                {source.label} | synced {new Date(source.lastSyncedAt).toLocaleString()}
              </p>
              {source.path ? (
                <p className="mt-2 break-all text-[11px] text-zinc-600">{source.path}</p>
              ) : null}
            </div>
          ))
        ) : null}
      </div>
    </CardShell>
  );
}
