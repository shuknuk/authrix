import { CardShell } from "@/components/ui/card-shell";
import type { DeploymentReadinessReport } from "@/types/deployment";

interface OperatorOnboardingCardProps {
  report: DeploymentReadinessReport;
}

export function OperatorOnboardingCard({
  report,
}: OperatorOnboardingCardProps) {
  const highlightedChecklist = report.checklist.slice(0, 4);

  return (
    <CardShell
      title="Operator Path"
      description="The cleanest first-run sequence for bringing Authrix online on a dedicated worker box."
      badge={
        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/8 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-cyan-100/75">
          Phase 9B
        </span>
      }
    >
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-zinc-500">
            First-Run Sequence
          </p>
          <div className="mt-4 grid gap-3">
            {highlightedChecklist.map((item, index) => (
              <div
                key={item.id}
                className="flex items-start gap-3 rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3"
              >
                <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-[11px] font-semibold text-cyan-100">
                  {index + 1}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-zinc-100">{item.label}</p>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-1 text-xs leading-5 text-zinc-400">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div className="rounded-[1.35rem] border border-emerald-300/15 bg-emerald-300/8 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-100/70">
              Ready When
            </p>
            <div className="mt-3 space-y-2 text-sm text-emerald-50/90">
              <p>Auth0 login works cleanly.</p>
              <p>GitHub is connected through the control tower.</p>
              <p>Runtime posture is honest and visible.</p>
              <p>The first workspace refresh has persisted successfully.</p>
            </div>
          </div>

          <div className="rounded-[1.35rem] border border-amber-300/15 bg-amber-300/8 p-4">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-amber-100/75">
              Immediate Focus
            </p>
            <div className="mt-3 space-y-2 text-xs leading-5 text-amber-50/85">
              {report.nextSteps.length > 0 ? (
                report.nextSteps.slice(0, 3).map((step) => <p key={step}>{step}</p>)
              ) : (
                <p>
                  Bring-up checks are aligned. The next layer is messaging and live
                  LLM-backed agent execution.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </CardShell>
  );
}

function StatusBadge({
  status,
}: {
  status: "pending" | "in_progress" | "complete";
}) {
  const className =
    status === "complete"
      ? "border-emerald-300/20 bg-emerald-300/10 text-emerald-100"
      : status === "in_progress"
        ? "border-amber-300/20 bg-amber-300/10 text-amber-100"
        : "border-white/10 bg-white/5 text-zinc-300";

  const label =
    status === "complete" ? "Complete" : status === "in_progress" ? "In progress" : "Pending";

  return (
    <span className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${className}`}>
      {label}
    </span>
  );
}
