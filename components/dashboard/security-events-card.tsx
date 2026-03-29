import { CardShell } from "@/components/ui/card-shell";
import { EmptyState } from "@/components/ui/empty-state";
import type { SecurityEvent } from "@/types/security";

interface SecurityEventsCardProps {
  events: SecurityEvent[];
  limit?: number;
}

export function SecurityEventsCard({
  events,
  limit,
}: SecurityEventsCardProps) {
  const visibleEvents = typeof limit === "number" ? events.slice(0, limit) : events;

  return (
    <CardShell
      title="Security Events"
      description="Policy-blocked actions and runtime guardrail events are recorded here so operators can inspect what Authrix refused to do."
    >
      {visibleEvents.length === 0 ? (
        <EmptyState
          title="No security events"
          description="When Authrix blocks a risky action or runtime request by policy, it will appear here."
        />
      ) : (
        <div className="space-y-3">
          {visibleEvents.map((event) => (
            <div
              key={event.id}
              className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${
                    event.level === "critical"
                      ? "bg-red-900/30 text-red-300"
                      : event.level === "warning"
                        ? "bg-amber-900/30 text-amber-300"
                        : "bg-zinc-800 text-zinc-400"
                  }`}
                >
                  {event.level}
                </span>
                <span className="text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                  {event.category}
                </span>
                <span className="text-[11px] text-zinc-600">
                  {new Date(event.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-zinc-200">{event.title}</p>
              <p className="mt-1 text-xs leading-5 text-zinc-500">{event.description}</p>
            </div>
          ))}
        </div>
      )}
    </CardShell>
  );
}
