import { PageHeader } from "@/components/layout/page-header";
import { WeeklySummaryCard } from "@/components/cards/weekly-summary-card";
import { SuggestedTasksCard } from "@/components/cards/suggested-tasks-card";
import { ActionRequestButton } from "@/components/ui/action-request-button";
import { getDashboardViewModel } from "@/lib/orchestrator/dashboard";

export default async function TasksPage() {
  const viewModel = await getDashboardViewModel();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Tasks"
        title="Approval-gated follow-up work"
        description="The task agent sees the weekly summary output only, generates next steps, and waits for explicit approval before any simulated write action."
      />

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <WeeklySummaryCard summary={viewModel.weeklySummary} />
        <SuggestedTasksCard
          tasks={viewModel.suggestedTasks}
          footer={
            <ActionRequestButton
              label="Approve task creation"
              request={{
                action: "create_tasks",
                label: "Create follow-up tasks",
                justification:
                  "Authrix will simulate creating the suggested tasks. The backend still validates approval before any execution is recorded.",
                payload: {
                  count: viewModel.suggestedTasks.length,
                  tasks: viewModel.suggestedTasks.map((task) => ({
                    title: task.title,
                    priority: task.priority,
                  })),
                },
              }}
            />
          }
        />
      </section>
    </div>
  );
}
