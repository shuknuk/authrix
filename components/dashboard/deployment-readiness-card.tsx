import { CardShell } from "@/components/ui/card-shell";
import { SignalList } from "@/components/ui/signal-list";
import { StatusPill } from "@/components/ui/status-pill";
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
      description="Operator-facing bring-up checklist for a dedicated Authrix worker box."
      tone={
        report.overallStatus === "ready"
          ? "success"
          : report.overallStatus === "warning"
            ? "warning"
            : "danger"
      }
      actions={<StatusBadge status={report.overallStatus}>{report.overallStatus}</StatusBadge>}
    >
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={report.deploymentMode === "worker-box" ? "ready" : "warning"}>
            {report.deploymentMode === "worker-box" ? "Worker-box mode" : "Local-dev mode"}
          </StatusBadge>
        </div>

        <SignalList
          items={report.checks.map((check) => ({
            id: check.id,
            title: check.label,
            description: check.message,
            meta: check.status,
            tone:
              check.status === "ready"
                ? "success"
                : check.status === "warning"
                  ? "warning"
                  : "danger",
          }))}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <div className="authrix-row px-4 py-3">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
              Bring-up Checklist
            </p>
            <div className="mt-3 space-y-2">
              {report.checklist.map((item) => (
                <div key={item.id}>
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm text-[var(--foreground)]">{item.label}</p>
                    <ChecklistBadge status={item.status}>
                      {formatChecklistStatus(item.status)}
                    </ChecklistBadge>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">{item.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="authrix-row px-4 py-3">
            <p className="font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-[var(--muted-foreground)]">
              Next Steps
            </p>
            <div className="mt-3 space-y-2">
              {report.nextSteps.length > 0 ? (
                report.nextSteps.map((step) => (
                  <p key={step} className="text-xs leading-5 text-[var(--muted-foreground)]">
                    {step}
                  </p>
                ))
              ) : (
                <p className="text-xs leading-5 text-[var(--muted-foreground)]">
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
  return (
    <StatusPill
      tone={status === "ready" ? "success" : status === "warning" ? "warning" : "danger"}
      size="sm"
    >
      {children}
    </StatusPill>
  );
}

function ChecklistBadge({
  children,
  status,
}: {
  children: React.ReactNode;
  status: "pending" | "in_progress" | "complete";
}) {
  return (
    <StatusPill
      tone={status === "complete" ? "success" : status === "in_progress" ? "warning" : "neutral"}
      size="sm"
    >
      {children}
    </StatusPill>
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
