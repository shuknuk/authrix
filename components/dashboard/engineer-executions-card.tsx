import { CardShell } from "@/components/ui/card-shell";
import type { EngineerExecutionRecord } from "@/types/engineer";

interface EngineerExecutionsCardProps {
  executions: EngineerExecutionRecord[];
  limit?: number;
}

export function EngineerExecutionsCard({
  executions,
  limit = 6,
}: EngineerExecutionsCardProps) {
  const visibleExecutions = executions.slice(0, limit);

  return (
    <CardShell
      title="Engineer Executions"
      description="These records track local coding runs, validation results, and approval-backed draft PR handoff for the Engineer specialist."
      badge={
        <span className="rounded-full border border-zinc-800 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
          {visibleExecutions.length} shown
        </span>
      }
    >
      <div className="space-y-3">
        {visibleExecutions.length > 0 ? (
          visibleExecutions.map((execution) => (
            <div
              key={execution.id}
              className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-zinc-200">
                      {truncate(execution.request, 88)}
                    </p>
                    <ExecutionStatusBadge status={execution.status} />
                  </div>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    Updated {formatTimestamp(execution.updatedAt)} on {execution.repository}
                    {" · "}branch {execution.branchName}
                  </p>
                  {execution.plan.length > 0 ? (
                    <p className="mt-3 text-xs leading-5 text-zinc-300">
                      Plan: {truncate(execution.plan.join(" | "), 220)}
                    </p>
                  ) : null}
                  {execution.diffSummary ? (
                    <p className="mt-3 text-xs leading-5 text-zinc-300">
                      Diff: {truncate(execution.diffSummary, 220)}
                    </p>
                  ) : null}
                  {execution.changedFiles.length > 0 ? (
                    <p className="mt-3 text-[11px] text-zinc-500">
                      Changed files: {execution.changedFiles.slice(0, 6).join(", ")}
                    </p>
                  ) : null}
                  {execution.checks.length > 0 ? (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {execution.checks.map((check) => (
                        <span
                          key={`${execution.id}-${check.name}`}
                          className={`rounded-full px-2.5 py-1 text-[11px] ${
                            check.status === "passed"
                              ? "bg-green-900/30 text-green-300"
                              : check.status === "failed"
                                ? "bg-red-900/30 text-red-300"
                                : "bg-zinc-800 text-zinc-400"
                          }`}
                        >
                          {check.name}: {check.status}
                        </span>
                      ))}
                    </div>
                  ) : null}
                  {execution.approvalRequestId ? (
                    <p className="mt-3 text-[11px] text-zinc-500">
                      Approval queued: {execution.approvalRequestId}
                    </p>
                  ) : null}
                  {execution.outputSummary ? (
                    <p className="mt-3 text-xs leading-5 text-zinc-300">
                      {truncate(execution.outputSummary, 260)}
                    </p>
                  ) : null}
                  {execution.clarificationQuestion ? (
                    <p className="mt-3 rounded-lg border border-amber-900/40 bg-amber-950/40 px-3 py-2 text-xs leading-5 text-amber-200">
                      {execution.clarificationQuestion}
                    </p>
                  ) : null}
                  {execution.error ? (
                    <p className="mt-3 rounded-lg border border-red-900/40 bg-red-950/40 px-3 py-2 text-xs leading-5 text-red-200">
                      {truncate(execution.error, 260)}
                    </p>
                  ) : null}
                </div>
                <div className="text-right text-[11px] text-zinc-600">
                  <p>{execution.id}</p>
                  <p className="mt-2">Run {execution.runId}</p>
                  <p className="mt-2">Session {execution.sessionId}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 px-4 py-6">
            <p className="text-sm text-zinc-200">No engineer executions yet.</p>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Engineer coding runs, validation checks, and draft PR approvals will appear here
              once autonomous engineering work starts.
            </p>
          </div>
        )}
      </div>
    </CardShell>
  );
}

function ExecutionStatusBadge({
  status,
}: {
  status: EngineerExecutionRecord["status"];
}) {
  const className =
    status === "completed"
      ? "bg-green-900/30 text-green-300"
      : status === "needs_clarification"
        ? "bg-amber-900/30 text-amber-300"
        : "bg-red-900/30 text-red-300";

  return <span className={`rounded-full px-2.5 py-1 text-[11px] ${className}`}>{status}</span>;
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}
