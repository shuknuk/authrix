import { SuggestedTasksCard } from "@/components/dashboard/suggested-tasks-card";
import { PageHeader } from "@/components/ui/page-header";
import { getSuggestedTasks } from "@/lib/data/workspace";

export default async function TasksPage() {
  const tasks = await getSuggestedTasks();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Suggested follow-ups generated from engineering summaries, risk signals, and workflow gaps."
      />
      <SuggestedTasksCard tasks={tasks} />
    </div>
  );
}
