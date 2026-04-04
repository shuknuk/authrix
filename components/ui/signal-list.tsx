import { StatusPill } from "@/components/ui/status-pill";

interface SignalListItem {
  id: string;
  title: string;
  description: string;
  meta?: string;
  tone?: "neutral" | "info" | "warning" | "danger" | "success";
}

interface SignalListProps {
  items: SignalListItem[];
}

export function SignalList({ items }: SignalListProps) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.id} className="authrix-row authrix-hover-surface px-4 py-3">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--foreground-strong)]">{item.title}</p>
              <p className="mt-1 text-sm leading-6 text-[var(--muted-foreground)]">
                {item.description}
              </p>
            </div>
            {item.meta ? (
              <StatusPill tone={item.tone ?? "neutral"} size="sm">
                {item.meta}
              </StatusPill>
            ) : null}
          </div>
        </div>
      ))}
    </div>
  );
}
