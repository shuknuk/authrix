import { CardShell } from "@/components/ui/card-shell";
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
          <div
            key={test.id}
            className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-zinc-200">{test.label}</p>
              <SmokeBadge status={toneFromSmokeStatus(test.status)}>
                {formatSmokeStatus(test.status)}
              </SmokeBadge>
            </div>
            <p className="mt-1 text-xs leading-5 text-zinc-500">{test.details}</p>
          </div>
        ))}

        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            Operator Notes
          </p>
          <div className="mt-3 space-y-2">
            {report.notes.length > 0 ? (
              report.notes.map((note) => (
                <p key={note} className="text-xs leading-5 text-zinc-400">
                  {note}
                </p>
              ))
            ) : (
              <p className="text-xs leading-5 text-zinc-400">
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
  const className =
    status === "ready"
      ? "bg-green-900/30 text-green-300"
      : status === "warning"
        ? "bg-amber-900/30 text-amber-300"
        : "bg-red-900/30 text-red-300";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs ${className}`}>{children}</span>
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
