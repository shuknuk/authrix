import type { TimelineEntry } from "@/types/domain";

async function fetchTimeline(): Promise<TimelineEntry[]> {
  const res = await fetch("http://localhost:3000/api/activity", {
    cache: "no-store",
  });
  return res.json();
}

export default async function ActivityPage() {
  const timeline = await fetchTimeline();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Activity</h2>
      <div className="space-y-4">
        {timeline.map((entry) => (
          <div
            key={entry.id}
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-4 flex items-start gap-4"
          >
            <div className="w-2 h-2 mt-2 rounded-full bg-zinc-600 shrink-0" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-xs text-zinc-500 font-mono">
                  {entry.type}
                </span>
                <span className="text-xs text-zinc-600">
                  {new Date(entry.timestamp).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-zinc-200 mt-1">{entry.title}</p>
              <p className="text-xs text-zinc-500 mt-1">{entry.description}</p>
              <div className="flex gap-3 mt-2 text-xs text-zinc-600">
                <span>{(entry.metadata as Record<string, string>).repo}</span>
                <span>{(entry.metadata as Record<string, string>).author}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
