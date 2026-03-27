import type { ReactNode } from "react";
import { CardFrame } from "@/components/cards/card-frame";
import { StatusBadge } from "@/components/ui/status-badge";
import type { SuggestedTask } from "@/types/authrix";

export function SuggestedTasksCard({
  tasks,
  status = "ready",
  footer,
}: {
  tasks?: SuggestedTask[];
  status?: "ready" | "loading" | "empty" | "error";
  footer?: ReactNode;
}) {
  return (
    <CardFrame
      eyebrow="Task agent"
      title="Suggested Tasks"
      description="Follow-up work generated from summary output only, without passing raw GitHub activity to the task agent."
      status={status}
      emptyMessage="The task list will appear once the weekly summary is available."
      errorMessage="The task agent could not suggest next steps."
      footer={footer}
    >
      {tasks?.length ? (
        <div className="space-y-3">
          {tasks.map((task) => (
            <article
              key={task.id}
              className="rounded-[1.25rem] border border-line bg-[rgba(17,33,50,0.03)] p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-semibold text-foreground">{task.title}</h3>
                  <p className="mt-2 text-sm leading-7 text-muted">
                    {task.description}
                  </p>
                </div>
                <StatusBadge
                  tone={
                    task.priority === "high"
                      ? "danger"
                      : task.priority === "medium"
                        ? "warning"
                        : "accent"
                  }
                >
                  {task.priority}
                </StatusBadge>
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-xs uppercase tracking-[0.16em] text-muted">
                <span>{task.owner}</span>
                <span>{task.approvalRequired ? "approval required" : "draft only"}</span>
              </div>
            </article>
          ))}
        </div>
      ) : null}
    </CardFrame>
  );
}
