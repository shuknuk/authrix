import { CardShell } from "@/components/ui/card-shell";
import type { RuntimeSessionRecord } from "@/types/runtime";

interface RuntimeSessionsCardProps {
  sessions: RuntimeSessionRecord[];
  limit?: number;
  title?: string;
  description?: string;
}

export function RuntimeSessionsCard({
  sessions,
  limit = 5,
  title = "Runtime Sessions",
  description = "Persistent agent sessions are the first building block for Slack thread continuity, memory, and follow-up execution.",
}: RuntimeSessionsCardProps) {
  const visibleSessions = sessions.slice(0, limit);

  return (
    <CardShell
      title={title}
      description={description}
      badge={
        <span className="rounded-full border border-zinc-800 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
          {visibleSessions.length} shown
        </span>
      }
    >
      <div className="space-y-3">
        {visibleSessions.length > 0 ? (
          visibleSessions.map((session) => (
            <div
              key={session.id}
              className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-zinc-200">
                      {session.label ?? "Unnamed runtime session"}
                    </p>
                    <SessionBadge session={session} />
                  </div>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    Agent {readAgentId(session)} via {formatOrigin(session.origin)}. Updated{" "}
                    {formatTimestamp(session.lastActiveAt)}.
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-zinc-500">
                    <span className="rounded-full border border-zinc-800 px-2 py-1">
                      Runs: {session.runCount}
                    </span>
                    <span className="rounded-full border border-zinc-800 px-2 py-1">
                      Messages: {session.messageCount}
                    </span>
                    {session.lastRunAt ? (
                      <span className="rounded-full border border-zinc-800 px-2 py-1">
                        Last run: {formatTimestamp(session.lastRunAt)}
                      </span>
                    ) : null}
                  </div>
                  {session.lastError ? (
                    <p className="mt-3 rounded-lg border border-red-900/40 bg-red-950/40 px-3 py-2 text-xs leading-5 text-red-200">
                      {session.lastError}
                    </p>
                  ) : null}
                </div>
                <p className="max-w-[11rem] truncate text-[11px] text-zinc-600">{session.id}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 px-4 py-6">
            <p className="text-sm text-zinc-200">No persistent runtime sessions yet.</p>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Once Authrix starts creating durable worker sessions, they will appear here with
              their run counts and last-known state.
            </p>
          </div>
        )}
      </div>
    </CardShell>
  );
}

function SessionBadge({ session }: { session: RuntimeSessionRecord }) {
  const className = session.lastError
    ? "bg-red-900/30 text-red-300"
    : session.state === "active"
      ? "bg-green-900/30 text-green-300"
      : "bg-zinc-800 text-zinc-400";

  return (
    <span className={`rounded-full px-2.5 py-1 text-[11px] ${className}`}>
      {session.lastError ? "Attention" : session.state}
    </span>
  );
}

function readAgentId(session: RuntimeSessionRecord): string {
  const agentId = session.metadata.agentId;
  return typeof agentId === "string" && agentId.trim().length > 0 ? agentId : "unknown";
}

function formatOrigin(origin: RuntimeSessionRecord["origin"]): string {
  if (origin === "api") {
    return "API";
  }

  return origin.charAt(0).toUpperCase() + origin.slice(1);
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}
