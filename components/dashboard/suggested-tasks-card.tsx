import { CardShell } from "@/components/ui/card-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import type { SuggestedTask } from "@/types/domain";

interface SuggestedTasksCardProps {
  tasks: SuggestedTask[];
  limit?: number;
  compact?: boolean;
}

function priorityTone(priority: SuggestedTask["priority"]) {
  if (priority === "critical") {
    return "danger" as const;
  }

  if (priority === "high") {
    return "warning" as const;
  }

  if (priority === "medium") {
    return "info" as const;
  }

  return "neutral" as const;
}

export function SuggestedTasksCard({
  tasks,
  limit,
  compact = false,
}: SuggestedTasksCardProps) {
  const visibleTasks = typeof limit === "number" ? tasks.slice(0, limit) : tasks;

  return (
    <CardShell
      title="Suggested Tasks"
      description="Follow-up work prepared from weekly review and risk signals."
      tone="accent"
      actions={
        visibleTasks.length > 0 ? <StatusPill tone="info">{visibleTasks.length} queued</StatusPill> : null
      }
    >
      {visibleTasks.length === 0 ? (
        <EmptyState
          title="No suggested tasks"
          description="When enough activity is available, follow-up work will appear here."
        />
      ) : (
        <div className="overflow-x-auto rounded-[12px] border border-[var(--border)] bg-[var(--background)]">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                <th className="px-4 py-3 font-medium">Task</th>
                <th className="px-4 py-3 font-medium">Priority</th>
                {!compact ? <th className="px-4 py-3 font-medium">Owner</th> : null}
                {!compact ? <th className="px-4 py-3 font-medium">Due</th> : null}
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleTasks.map((task) => (
                <tr key={task.id} className="border-t border-[var(--border)] align-top first:border-t-0">
                  <td className="px-4 py-3">
                    <p className="font-medium text-[var(--foreground-strong)]">{task.title}</p>
                    {!compact ? (
                      <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                        {task.description}
                      </p>
                    ) : null}
                  </td>
                  <td className="px-4 py-3">
                    <StatusPill tone={priorityTone(task.priority)} size="sm">
                      {task.priority}
                    </StatusPill>
                  </td>
                  {!compact ? (
                    <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">
                      {task.suggestedOwner ?? "Unassigned"}
                    </td>
                  ) : null}
                  {!compact ? (
                    <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
                    </td>
                  ) : null}
                  <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">{task.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </CardShell>
  );
}
