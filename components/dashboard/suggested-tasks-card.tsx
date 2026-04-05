import { CardShell } from "@/components/ui/card-shell";
import { EmptyState } from "@/components/ui/empty-state";
import type { SuggestedTask } from "@/types/domain";

interface SuggestedTasksCardProps {
  tasks: SuggestedTask[];
  limit?: number;
  compact?: boolean;
}

interface TrackingBadge {
  label: string;
  href?: string;
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

function getTrackingBadge(task: SuggestedTask): TrackingBadge | null {
  const issueNumber = task.metadata?.githubIssueNumber;
  const issueUrl = task.metadata?.githubIssueUrl;
  if (typeof issueNumber === "number") {
    return {
      label: `GitHub issue #${issueNumber}`,
      href: typeof issueUrl === "string" ? issueUrl : undefined,
    };
  }

  const trackingStatus =
    typeof task.metadata?.trackingStatus === "string"
      ? task.metadata.trackingStatus
      : null;

  switch (trackingStatus) {
    case "approval_pending":
      return { label: "GitHub issue approval queued" };
    case "approval_rejected":
      return { label: "GitHub issue approval rejected" };
    case "execution_failed":
      return { label: "GitHub issue execution failed" };
    case "tracked":
      return { label: "GitHub issue linked" };
    default:
      return null;
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
          {visibleTasks.map((task) => {
            const trackingBadge = getTrackingBadge(task);

            return (
              <div
                key={task.id}
                className="rounded-[1.25rem] border border-white/8 bg-slate-950/45 px-4 py-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <span
                      className={`mt-1 inline-block h-2 w-2 shrink-0 rounded-full ${getPriorityDot(
                        task.priority
                      )}`}
                    />
                    <div>
                      <p className="text-sm font-medium text-zinc-100">{task.title}</p>
                      {!compact ? (
                        <p className="mt-1 text-xs leading-5 text-slate-400">
                          {task.description}
                        </p>
                      ) : null}
                    </div>
                  </div>
                  <span className="shrink-0 rounded-full border border-white/8 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-slate-400">
                    {task.priority}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
                  <span className="rounded-full border border-white/6 bg-white/5 px-2.5 py-1">
                    {task.source}
                  </span>
                  {trackingBadge ? (
                    trackingBadge.href ? (
                      <a
                        href={trackingBadge.href}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-cyan-100 transition hover:border-cyan-300/40 hover:bg-cyan-300/15"
                      >
                        {trackingBadge.label}
                      </a>
                    ) : (
                      <span className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-2.5 py-1 text-cyan-100">
                        {trackingBadge.label}
                      </span>
                    )
                  ) : null}
                  {!compact && task.suggestedOwner ? (
                    <span className="rounded-full border border-white/6 bg-white/5 px-2.5 py-1">
                      Owner: {task.suggestedOwner}
                    </span>
                  ) : null}
                  {!compact && task.dueDate ? (
                    <span className="rounded-full border border-white/6 bg-white/5 px-2.5 py-1">
                      Due: {new Date(task.dueDate).toLocaleDateString()}
                    </span>
                  ) : null}
                  {!compact ? (
                    <span className="rounded-full border border-white/6 bg-white/5 px-2.5 py-1">
                      Status: {task.status}
                    </span>
                  ) : null}
                  {!compact ? (
                    <span className="rounded-full border border-white/6 bg-white/5 px-2.5 py-1">
                      Agent: {task.sourceAgentId}
                    </span>
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
