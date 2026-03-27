import { WeeklySummaryCard } from "@/components/cards/weekly-summary-card";
import { SuggestedTasksCard } from "@/components/cards/suggested-tasks-card";
import { ApiSpendRiskCard } from "@/components/cards/api-spend-risk-card";
import { ApprovalQueueCard } from "@/components/cards/approval-queue-card";
import { PageHeader } from "@/components/layout/page-header";
import { ActionRequestButton } from "@/components/ui/action-request-button";
import { StatusBadge } from "@/components/ui/status-badge";
import { getDashboardViewModel } from "@/lib/orchestrator/dashboard";

export default async function DashboardPage() {
  const viewModel = await getDashboardViewModel();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Dashboard"
        title="Secure operating snapshot"
        description="One opinionated view of engineering activity, suggested follow-up work, cost pressure, and approval-gated execution."
        aside={
          <StatusBadge
            tone={viewModel.github.source === "github" ? "success" : "warning"}
          >
            {viewModel.github.source === "github"
              ? "Live GitHub feed"
              : "Mock-backed feed"}
          </StatusBadge>
        }
      />

      <section className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
        <WeeklySummaryCard
          summary={viewModel.weeklySummary}
          status={viewModel.github.activities.length ? "ready" : "empty"}
        />
        <SuggestedTasksCard
          tasks={viewModel.suggestedTasks}
          status={viewModel.suggestedTasks.length ? "ready" : "empty"}
          footer={
            <ActionRequestButton
              label="Create tasks"
              request={{
                action: "create_tasks",
                label: "Create suggested tasks",
                justification:
                  "This action will simulate creating follow-up tasks from the structured task-agent output. It is explicitly approval-gated before execution.",
                payload: {
                  tasks: viewModel.suggestedTasks.map((task) => ({
                    id: task.id,
                    title: task.title,
                    priority: task.priority,
                  })),
                },
              }}
            />
          }
        />
      </section>

      <section className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <ApiSpendRiskCard insight={viewModel.costRisk} />
        <ApprovalQueueCard items={viewModel.approvalQueue} />
      </section>
    </div>
  );
}
