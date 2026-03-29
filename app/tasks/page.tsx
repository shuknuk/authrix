import { SuggestedTasksCard } from "@/components/dashboard/suggested-tasks-card";
import { PageHeader } from "@/components/ui/page-header";
import { requireSession } from "@/lib/auth/session";
import { getWorkspaceSnapshot } from "@/lib/data/workspace";

export default async function TasksPage() {
  await requireSession("/tasks");

  const snapshot = await getWorkspaceSnapshot();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tasks"
        description="Suggested follow-ups generated from engineering summaries, risk signals, and workflow gaps."
      />
      <SuggestedTasksCard tasks={snapshot.tasks} />
    </div>
  );
}
