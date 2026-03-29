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
      description="Recent engineering and operational events flowing into Authrix."
    >
      {visibleEntries.length === 0 ? (
        <EmptyState
          title="No timeline entries"
          description="Once activity is ingested, Authrix will build a shared event history here."
        />
      ) : (
        <div className="space-y-3">
          {visibleEntries.map((entry) => {
            const metadata = entry.metadata as Record<string, string>;

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
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-zinc-600">
                    {metadata.repo ? <span>{metadata.repo}</span> : null}
                    {metadata.author ? <span>{metadata.author}</span> : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CardShell>
  );
}
