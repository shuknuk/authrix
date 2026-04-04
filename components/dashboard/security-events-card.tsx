import { CardShell } from "@/components/ui/card-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
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
      tone={visibleEvents.some((event) => event.level === "critical") ? "danger" : "default"}
    >
      {visibleEvents.length === 0 ? (
        <EmptyState
          title="No security events"
          description="When Authrix blocks a risky action or runtime request by policy, it will appear here."
        />
      ) : (
        <div className="space-y-3">
          {visibleEvents.map((event) => (
            <div key={event.id} className="authrix-row px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                <StatusPill
                  tone={
                    event.level === "critical"
                      ? "danger"
                      : event.level === "warning"
                        ? "warning"
                        : "neutral"
                  }
                  size="sm"
                >
                  {event.level}
                </StatusPill>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  {event.category}
                </span>
                <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  {new Date(event.timestamp).toLocaleString()}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-[var(--foreground)]">{event.title}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">{event.description}</p>
            </div>
          ))}
        </div>
      )}
    </CardShell>
  );
}
