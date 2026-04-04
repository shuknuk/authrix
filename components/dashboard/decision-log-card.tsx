import { CardShell } from "@/components/ui/card-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
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
            <div key={decision.id} className="authrix-row px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-[var(--foreground)]">{decision.title}</p>
                <StatusPill
                  tone={
                    decision.status === "accepted"
                      ? "success"
                      : decision.status === "superseded"
                        ? "warning"
                        : "neutral"
                  }
                  size="sm"
                >
                    {decision.status}
                  </StatusPill>
              </div>
              <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">{decision.summary}</p>
              <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-[var(--muted-foreground)]">
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
