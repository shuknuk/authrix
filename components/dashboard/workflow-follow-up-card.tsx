import { CardShell } from "@/components/ui/card-shell";
import { EmptyState } from "@/components/ui/empty-state";
import type { WorkflowFollowUpRecord } from "@/types/workflow";

interface WorkflowFollowUpCardProps {
  records: WorkflowFollowUpRecord[];
  limit?: number;
}

function getSeverityStyles(severity: WorkflowFollowUpRecord["severity"]): string {
  switch (severity) {
    case "high":
      return "border-red-800/40 bg-red-900/10 text-red-100";
    case "medium":
      return "border-amber-800/40 bg-amber-900/10 text-amber-100";
    default:
      return "border-white/10 bg-white/5 text-zinc-200";
  }
}

function getKindLabel(kind: WorkflowFollowUpRecord["kind"]): string {
  switch (kind) {
    case "missing_owner":
      return "Missing owner";
    case "due_soon":
      return "Due soon";
    case "overdue":
      return "Overdue";
    case "ticket_pending":
      return "Ticket pending";
  }
}

export function WorkflowFollowUpCard({
  records,
  limit,
}: WorkflowFollowUpCardProps) {
  const visibleRecords = typeof limit === "number" ? records.slice(0, limit) : records;

  return (
    <CardShell
      title="Workflow Follow-Through"
      description="Reminder and stale-work records that Workflow keeps open until ownership or tracking is resolved."
      badge={
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-400">
          {visibleRecords.length} shown
        </span>
      }
    >
      {visibleRecords.length === 0 ? (
        <EmptyState
          title="No follow-through gaps"
          description="Authrix is not seeing overdue work, missing owners, or pending GitHub ticket follow-up right now."
        />
      ) : (
        <div className="space-y-3">
          {visibleRecords.map((record) => (
            <div
              key={record.id}
              className="rounded-[1.25rem] border border-white/8 bg-slate-950/45 px-4 py-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${getSeverityStyles(
                    record.severity
                  )}`}
                >
                  {record.severity}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-300">
                  {getKindLabel(record.kind)}
                </span>
              </div>
              <p className="mt-3 text-sm font-medium text-zinc-100">{record.taskTitle}</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">{record.message}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                {record.owner ? (
                  <span className="rounded-full border border-white/6 bg-white/5 px-2.5 py-1">
                    Owner: {record.owner}
                  </span>
                ) : null}
                {record.dueDate ? (
                  <span className="rounded-full border border-white/6 bg-white/5 px-2.5 py-1">
                    Due: {new Date(record.dueDate).toLocaleDateString()}
                  </span>
                ) : null}
                <span className="rounded-full border border-white/6 bg-white/5 px-2.5 py-1">
                  Created: {new Date(record.createdAt).toLocaleString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </CardShell>
  );
}
