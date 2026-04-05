import { CardShell } from "@/components/ui/card-shell";
import type { AgentHandoffRecord } from "@/types/domain";

interface AgentHandoffsCardProps {
  handoffs: AgentHandoffRecord[];
  limit?: number;
}

export function AgentHandoffsCard({
  handoffs,
  limit = 6,
}: AgentHandoffsCardProps) {
  const visibleHandoffs = handoffs.slice(0, limit);

  return (
    <CardShell
      title="Agent Handoffs"
      description="Cross-specialist records keep Docs, Workflow, Finance/Ops, Engineer, and the approval layer aligned when work moves across boundaries."
      badge={
        <span className="rounded-full border border-zinc-800 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
          {visibleHandoffs.length} shown
        </span>
      }
    >
      <div className="space-y-3">
        {visibleHandoffs.length > 0 ? (
          visibleHandoffs.map((handoff) => (
            <div
              key={handoff.id}
              className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-zinc-200">
                  {formatAgent(handoff.fromAgentId)} {"->"} {formatAgent(handoff.toAgentId)}
                </p>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${
                    handoff.status === "completed"
                      ? "bg-green-900/30 text-green-300"
                      : "bg-amber-900/30 text-amber-300"
                  }`}
                >
                  {handoff.status}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-zinc-300">{handoff.reason}</p>
              <p className="mt-3 text-[11px] text-zinc-500">
                Source {handoff.source} | created {formatTimestamp(handoff.createdAt)}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 px-4 py-6">
            <p className="text-sm text-zinc-200">No cross-agent handoffs recorded yet.</p>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              Delegations, workflow handoffs, and approval escalations will appear here once
              Authrix starts moving work between specialists.
            </p>
          </div>
        )}
      </div>
    </CardShell>
  );
}

function formatAgent(agentId: string): string {
  if (agentId === "devops") {
    return "Finance/Ops";
  }

  if (agentId === "approval-engine") {
    return "Approval";
  }

  return agentId.charAt(0).toUpperCase() + agentId.slice(1);
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}
