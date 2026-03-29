import { CardShell } from "@/components/ui/card-shell";
import { EmptyState } from "@/components/ui/empty-state";
import type { TimelineEntry } from "@/types/domain";

interface ActivityTimelineCardProps {
  entries: TimelineEntry[];
  limit?: number;
}

export function ActivityTimelineCard({
  entries,
  limit,
}: ActivityTimelineCardProps) {
  const visibleEntries =
    typeof limit === "number" ? entries.slice(0, limit) : entries;

  return (
    <CardShell
      title="Activity Timeline"
      description="Recent engineering, meeting, workflow, and operational events flowing into Authrix."
    >
      {visibleEntries.length === 0 ? (
        <EmptyState
          title="No timeline entries"
          description="Once activity is ingested, Authrix will build a shared event history here."
        />
      ) : (
        <div className="space-y-3">
          {visibleEntries.map((entry) => {
            const metadata = entry.metadata as Record<string, unknown>;
            const badges = [
              typeof metadata.repo === "string" ? metadata.repo : null,
              typeof metadata.author === "string" ? metadata.author : null,
              typeof metadata.documentType === "string" ? metadata.documentType : null,
              typeof metadata.category === "string" ? metadata.category : null,
              typeof metadata.severity === "string" ? metadata.severity : null,
              typeof metadata.status === "string" ? metadata.status : null,
              typeof metadata.participants === "string" && metadata.participants
                ? metadata.participants
                : null,
            ].filter((value): value is string => Boolean(value));

            return (
              <div
                key={entry.id}
                className="flex items-start gap-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3"
              >
                <div className="mt-2 h-2 w-2 shrink-0 rounded-full bg-zinc-600" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-mono text-zinc-500">
                      {entry.type}
                    </span>
                    <span className="text-xs text-zinc-600">
                      {new Date(entry.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-zinc-200">{entry.title}</p>
                  <p className="mt-1 text-xs leading-5 text-zinc-500">
                    {entry.description}
                  </p>
                  {badges.length > 0 ? (
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-600">
                      {badges.map((badge) => (
                        <span key={`${entry.id}-${badge}`}>{badge}</span>
                      ))}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CardShell>
  );
}
