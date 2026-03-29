import { CardShell } from "@/components/ui/card-shell";
import type { DeploymentReadinessReport } from "@/types/deployment";

interface DeploymentReadinessCardProps {
  report: DeploymentReadinessReport;
}

export function DeploymentReadinessCard({
  report,
}: DeploymentReadinessCardProps) {
  return (
    <CardShell
      title="Deployment Readiness"
      description="This is the operator-facing bring-up checklist for a dedicated Authrix worker box."
      badge={<StatusBadge status={report.overallStatus}>{report.overallStatus}</StatusBadge>}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={report.deploymentMode === "worker-box" ? "ready" : "warning"}>
            {report.deploymentMode === "worker-box" ? "Worker-box mode" : "Local-dev mode"}
          </StatusBadge>
        </div>

        <div className="space-y-2">
          {report.checks.map((check) => (
            <div
              key={check.id}
              className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-zinc-200">{check.label}</p>
                <StatusBadge status={check.status}>{check.status}</StatusBadge>
              </div>
              <p className="mt-1 text-xs leading-5 text-zinc-500">{check.message}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
              Bring-up Checklist
            </p>
            <div className="mt-3 space-y-2">
              {report.checklist.map((item) => (
                <div key={item.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-zinc-200">{item.label}</p>
                    <ChecklistBadge status={item.status}>
                      {formatChecklistStatus(item.status)}
                    </ChecklistBadge>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
              Next Steps
            </p>
            <div className="mt-3 space-y-2">
              {report.nextSteps.length > 0 ? (
                report.nextSteps.map((step) => (
                  <p key={step} className="text-xs leading-5 text-zinc-400">
                    {step}
                  </p>
                ))
              ) : (
                <p className="text-xs leading-5 text-zinc-400">
                  Worker-box bring-up checks are aligned. You can move into deployment smoke testing.
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

function ChecklistBadge({
  children,
  status,
}: {
  children: React.ReactNode;
  status: "pending" | "in_progress" | "complete";
}) {
  const className =
    status === "complete"
      ? "bg-green-900/30 text-green-300"
      : status === "in_progress"
        ? "bg-amber-900/30 text-amber-300"
        : "bg-zinc-800 text-zinc-400";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs ${className}`}>{children}</span>
  );
}

function formatChecklistStatus(status: "pending" | "in_progress" | "complete") {
  if (status === "in_progress") {
    return "In progress";
  }

  if (status === "complete") {
    return "Complete";
  }

  return "Pending";
}
