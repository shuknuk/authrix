import { CardShell } from "@/components/ui/card-shell";
import type { SuggestedTask } from "@/types/domain";

interface TaskHealthCardProps {
  tasks: SuggestedTask[];
}

export function TaskHealthCard({ tasks }: TaskHealthCardProps) {
  const openTasks = tasks.filter((task) => task.status !== "completed");
  const completedTasks = tasks.filter((task) => task.status === "completed");
  const unownedTasks = openTasks.filter((task) => !task.suggestedOwner);
  const overdueTasks = openTasks.filter(
    (task) => task.dueDate && new Date(task.dueDate).getTime() < Date.now()
  );

  const metrics = [
    { label: "Open tasks", value: openTasks.length },
    { label: "Completed", value: completedTasks.length },
    { label: "Missing owners", value: unownedTasks.length },
    { label: "Overdue", value: overdueTasks.length },
  ];

  return (
    <CardShell
      title="Workflow Health"
      description="Ownership and follow-through quality across the persisted task set."
    >
      <div className="grid grid-cols-2 gap-3">
        {metrics.map((metric) => (
          <div
            key={metric.label}
            className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3"
          >
            <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">
              {metric.label}
            </p>
            <p className="mt-2 text-2xl font-semibold text-zinc-100">{metric.value}</p>
          </div>
        ))}
      </div>
    </CardShell>
  );
}
