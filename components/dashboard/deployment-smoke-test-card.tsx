import { CardShell } from "@/components/ui/card-shell";
import { StatusPill } from "@/components/ui/status-pill";
import type { DeploymentSmokeReport } from "@/types/deployment";

interface DeploymentSmokeTestCardProps {
  report: DeploymentSmokeReport;
}

export function DeploymentSmokeTestCard({
  report,
}: DeploymentSmokeTestCardProps) {
  return (
    <CardShell
      title="Deployment Smoke Test"
      description="These checks confirm the worker box can load persisted state, evaluate security posture, and expose the main operator surfaces."
      badge={<SmokeBadge status={report.overallStatus}>{report.overallStatus}</SmokeBadge>}
    >
      <div className="space-y-3">
        {report.tests.map((test) => (
          <div key={test.id} className="authrix-row px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-[var(--foreground)]">{test.label}</p>
              <SmokeBadge status={toneFromSmokeStatus(test.status)}>
                {formatSmokeStatus(test.status)}
              </SmokeBadge>
            </div>
            <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">{test.details}</p>
          </div>
        ))}

        <div className="authrix-row px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
            Operator Notes
          </p>
          <div className="mt-3 space-y-2">
            {report.notes.length > 0 ? (
              report.notes.map((note) => (
                <p key={note} className="text-xs leading-5 text-[var(--muted-foreground)]">
                  {note}
                </p>
              ))
            ) : (
              <p className="text-xs leading-5 text-[var(--muted-foreground)]">
                No smoke-test warnings remain. The worker-box bring-up path looks healthy.
              </p>
            )}
          </div>
        </div>
      </div>
    </CardShell>
  );
}

function SmokeBadge({
  children,
  status,
}: {
  children: React.ReactNode;
  status: "ready" | "warning" | "blocked";
}) {
  return (
    <StatusPill
      tone={status === "ready" ? "success" : status === "warning" ? "warning" : "danger"}
      size="sm"
    >
      {children}
    </StatusPill>
  );
}

function toneFromSmokeStatus(status: "passed" | "warning" | "failed") {
  if (status === "passed") {
    return "ready";
  }

  if (status === "warning") {
    return "warning";
  }

  return "blocked";
}

function formatSmokeStatus(status: "passed" | "warning" | "failed") {
  if (status === "passed") {
    return "Passed";
  }

  if (status === "warning") {
    return "Warning";
  }

  return "Failed";
}
