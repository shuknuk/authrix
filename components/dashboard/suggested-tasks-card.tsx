import { CardShell } from "@/components/ui/card-shell";
import { EmptyState } from "@/components/ui/empty-state";
import type { SuggestedTask } from "@/types/domain";

interface SuggestedTasksCardProps {
  tasks: SuggestedTask[];
  limit?: number;
  compact?: boolean;
}

function getPriorityDot(priority: SuggestedTask["priority"]) {
  switch (priority) {
    case "critical":
      return "bg-red-500";
    case "high":
      return "bg-orange-500";
    case "medium":
      return "bg-yellow-500";
    default:
      return "bg-zinc-500";
  }
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
      description="Follow-up work extracted from summaries, risks, and recent activity."
    >
      {visibleTasks.length === 0 ? (
        <EmptyState
          title="No suggested tasks"
          description="Once Authrix sees enough activity, it will surface structured follow-ups here."
        />
      ) : (
        <div className="space-y-3">
          {visibleTasks.map((task) => (
            <div
              key={task.id}
              className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${getPriorityDot(
                      task.priority
                    )}`}
                  />
                  <div>
                    <p className="text-sm font-medium text-zinc-200">
                      {task.title}
                    </p>
                    {!compact ? (
                      <p className="mt-1 text-xs leading-5 text-zinc-400">
                        {task.description}
                      </p>
                    ) : null}
                  </div>
                </div>
                <span className="shrink-0 text-[11px] uppercase tracking-wide text-zinc-500">
                  {task.priority}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs text-zinc-600">
                <span>{task.source}</span>
                {!compact ? <span>Status: {task.status}</span> : null}
                {!compact ? <span>Agent: {task.sourceAgentId}</span> : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </CardShell>
  );
}
