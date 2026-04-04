import { CardShell } from "@/components/ui/card-shell";
import { MetricTile } from "@/components/ui/metric-tile";
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
      tone={overdueTasks.length > 0 ? "warning" : "default"}
    >
      <div className="grid grid-cols-2 gap-4 border-y border-[var(--border)] py-4">
        {metrics.map((metric) => (
          <MetricTile
            key={metric.label}
            label={metric.label}
            value={metric.value}
            tone={
              metric.label === "Overdue" && metric.value > 0
                ? "warning"
                : metric.label === "Missing owners" && metric.value > 0
                  ? "danger"
                  : "default"
            }
          />
        ))}
      </div>
    </CardShell>
  );
}
