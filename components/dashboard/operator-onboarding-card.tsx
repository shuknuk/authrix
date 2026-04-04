import { CardShell } from "@/components/ui/card-shell";
import { StatusPill } from "@/components/ui/status-pill";
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
      tone="accent"
      actions={<StatusPill tone="info">Worker-box path</StatusPill>}
    >
      <div className="grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] p-4">
          <p className="font-mono text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--muted-foreground)]">
            First-Run Sequence
          </p>
          <div className="mt-4 grid gap-3">
            {highlightedChecklist.map((item, index) => (
              <div
                key={item.id}
                className="authrix-row flex items-start gap-3 px-4 py-3"
              >
                <span
                  className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold"
                  style={{
                    color: "var(--primary)",
                    borderColor: "color-mix(in srgb, var(--primary) 20%, transparent)",
                    background: "color-mix(in srgb, var(--primary) 8%, transparent)",
                  }}
                >
                  {index + 1}
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-[var(--foreground)]">{item.label}</p>
                    <StatusBadge status={item.status} />
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3">
          <div
            className="rounded-[var(--radius-md)] border p-4"
            style={{
              borderColor: "color-mix(in srgb, var(--success) 18%, transparent)",
              background: "color-mix(in srgb, var(--success) 6%, transparent)",
            }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--success)]">
              Ready When
            </p>
            <div className="mt-3 space-y-2 text-sm text-[var(--foreground)]/92">
              <p>Auth0 login works cleanly.</p>
              <p>GitHub is connected through the workspace.</p>
              <p>Runtime posture is honest and visible.</p>
              <p>The first workspace refresh has persisted successfully.</p>
            </div>
          </div>

          <div
            className="rounded-[var(--radius-md)] border p-4"
            style={{
              borderColor: "color-mix(in srgb, var(--warning) 18%, transparent)",
              background: "color-mix(in srgb, var(--warning) 6%, transparent)",
            }}
          >
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--warning)]">
              Immediate Focus
            </p>
            <div className="mt-3 space-y-2 text-xs leading-5 text-[var(--foreground)]/86">
              {report.nextSteps.length > 0 ? (
                report.nextSteps.slice(0, 3).map((step) => <p key={step}>{step}</p>)
              ) : (
                <p>
                  Bring-up checks are aligned. The next layer is messaging and live
                  model-backed specialist execution.
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
  const label =
    status === "complete" ? "Complete" : status === "in_progress" ? "In progress" : "Pending";

  return (
    <StatusPill
      tone={status === "complete" ? "success" : status === "in_progress" ? "warning" : "neutral"}
      size="sm"
    >
      {label}
    </StatusPill>
  );
}
