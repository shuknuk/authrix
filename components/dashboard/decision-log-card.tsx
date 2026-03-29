import { CardShell } from "@/components/ui/card-shell";
import { EmptyState } from "@/components/ui/empty-state";
import type { DecisionRecord } from "@/types/domain";

interface DecisionLogCardProps {
  decisions: DecisionRecord[];
  limit?: number;
}

export function DecisionLogCard({
  decisions,
  limit = 4,
}: DecisionLogCardProps) {
  const visibleDecisions = decisions.slice(0, limit);

  return (
    <CardShell
      title="Decision Log"
      description="Durable decisions extracted from meeting inputs and linked to the rest of the workspace."
    >
      {visibleDecisions.length === 0 ? (
        <EmptyState
          title="No decisions logged"
          description="Once meeting sources are processed, Authrix will capture accepted decisions here."
        />
      ) : (
        <div className="space-y-3">
          {visibleDecisions.map((decision) => (
            <div
              key={decision.id}
              className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-zinc-200">{decision.title}</p>
                <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-zinc-500">
                  {decision.status}
                </span>
              </div>
              <p className="mt-2 text-xs leading-5 text-zinc-400">{decision.summary}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-zinc-600">
                <span>{new Date(decision.createdAt).toLocaleDateString()}</span>
                <span>{decision.participants.length} participants</span>
                <span>{decision.relatedTaskIds.length} linked tasks</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardShell>
  );
}
