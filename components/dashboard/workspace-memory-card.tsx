import { CardShell } from "@/components/ui/card-shell";
import type { WorkspaceMemoryRecord } from "@/types/domain";

interface WorkspaceMemoryCardProps {
  memories: WorkspaceMemoryRecord[];
  limit?: number;
}

export function WorkspaceMemoryCard({
  memories,
  limit = 5,
}: WorkspaceMemoryCardProps) {
  const visibleMemories = memories.slice(0, limit);

  return (
    <CardShell
      title="Shared Memory"
      description="Authrix compacts durable workspace memory so specialists can resume, hand off, and follow up without starting from zero."
      badge={
        <span className="rounded-full border border-zinc-800 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
          {visibleMemories.length} shown
        </span>
      }
    >
      <div className="space-y-3">
        {visibleMemories.length > 0 ? (
          visibleMemories.map((memory) => (
            <div
              key={memory.id}
              className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-zinc-200">{memory.title}</p>
                <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-zinc-500">
                  {memory.category}
                </span>
                <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] text-zinc-400">
                  {memory.confidence}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-zinc-300">{memory.summary}</p>
              <p className="mt-3 text-[11px] text-zinc-500">
                From {formatAgent(memory.sourceAgentId)} | updated {formatTimestamp(memory.updatedAt)}
              </p>
            </div>
          ))
        ) : (
          <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 px-4 py-6">
            <p className="text-sm text-zinc-200">No shared memory records yet.</p>
            <p className="mt-2 text-xs leading-5 text-zinc-500">
              As Authrix persists more work, decisions, and session continuity, shared memory
              records will appear here.
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

  return agentId.charAt(0).toUpperCase() + agentId.slice(1);
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}
