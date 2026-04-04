import { CardShell } from "@/components/ui/card-shell";
import type { RuntimeRunRecord } from "@/types/runtime";

interface RuntimeRunsCardProps {
  runs: RuntimeRunRecord[];
  limit?: number;
  title?: string;
  description?: string;
}

export function RuntimeRunsCard({
  runs,
  limit = 5,
  title = "Runtime Runs",
  description = "These records track what Authrix asked an agent to do, whether the run completed, and what came back.",
}: RuntimeRunsCardProps) {
  const visibleRuns = runs.slice(0, limit);

  return (
    <CardShell
      title={title}
      description={description}
      badge={
        <span className="rounded-full border border-zinc-800 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
          {visibleRuns.length} shown
        </span>
      }
    >
      <div className="space-y-3">
        {visibleRuns.length > 0 ? (
          visibleRuns.map((run) => (
            <div
              key={run.id}
              className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-zinc-200">
                      {formatAgentId(run.agentId)}
                    </p>
                    <RunStatusBadge status={run.status} />
                    <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                      {run.provider}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    Created {formatTimestamp(run.createdAt)} via {run.origin}.
                  </p>
                  <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                    Input
                  </p>
                  <p className="mt-1 text-xs leading-5 text-zinc-300">{run.inputSummary}</p>
                  {run.outputSummary ? (
                    <>
                      <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
                        Output
                      </p>
                      <p className="mt-1 text-xs leading-5 text-zinc-300">{run.outputSummary}</p>
                    </>
                  ) : null}
                  {run.error ? (
                    <p className="mt-3 rounded-lg border border-red-900/40 bg-red-950/40 px-3 py-2 text-xs leading-5 text-red-200">
                      {run.error}
                    </p>
                  ) : null}
                  {run.tools.length > 0 ? (
                    <p className="mt-3 text-[11px] text-zinc-500">
                      Tools: {run.tools.join(", ")}
                    </p>
                  ) : null}
                </div>
                <div className="text-right text-[11px] text-zinc-600">
                  <p>{run.id}</p>
                  <p className="mt-2">Session {run.sessionId}</p>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 px-4 py-6">
            <p className="text-sm text-zinc-200">No recorded runtime runs yet.</p>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Queued and completed agent work will appear here once Authrix starts executing
              durable runtime tasks.
            </p>
          </div>
        )}
      </div>
    </CardShell>
  );
}

function RunStatusBadge({ status }: { status: RuntimeRunRecord["status"] }) {
  const className =
    status === "completed"
      ? "bg-green-900/30 text-green-300"
      : status === "failed"
        ? "bg-red-900/30 text-red-300"
        : status === "running"
          ? "bg-amber-900/30 text-amber-300"
          : "bg-zinc-800 text-zinc-400";

  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] ${className}`}>{status}</span>
  );
}

function formatAgentId(agentId: string): string {
  return agentId.charAt(0).toUpperCase() + agentId.slice(1);
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}
