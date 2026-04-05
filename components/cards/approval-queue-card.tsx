import { CardFrame } from "@/components/cards/card-frame";
import { StatusBadge } from "@/components/ui/status-badge";
import { formatDateTime } from "@/lib/utils";
import type { ApprovalQueueItem } from "@/types/authrix";

export function ApprovalQueueCard({
  items,
  status = "ready",
}: {
  items?: ApprovalQueueItem[];
  status?: "ready" | "loading" | "empty" | "error";
}) {
  return (
    <CardFrame
      eyebrow="Execution control"
      title="Approval Queue"
      description="Every write action is recorded here after explicit user approval."
      status={status}
      emptyMessage="The queue is empty because no actions have been submitted yet."
      errorMessage="The approval queue could not be loaded."
    >
      {items?.length ? (
        <div className="space-y-3">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-[1.25rem] border border-line bg-[rgba(17,33,50,0.03)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">{item.action}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted">{item.summary}</p>
                </div>
                <StatusBadge
                  tone={
                    item.status === "executed"
                      ? "success"
                      : item.status === "approved"
                        ? "accent"
                        : item.status === "pending"
                          ? "warning"
                          : "danger"
                  }
                >
                  {item.status}
                </StatusBadge>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.16em] text-muted">
                <span>{item.actor}</span>
                <span>{formatDateTime(item.requestedAt)}</span>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </CardFrame>
  );
}
