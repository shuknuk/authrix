import type { WorkflowAgentInput, WorkflowAgentOutput } from "@/types/agents";
import type { MeetingArtifact, RiskAlert, SuggestedTask } from "@/types/domain";

export function workflowAgent(
  input: WorkflowAgentInput
): WorkflowAgentOutput {
  const meetingArtifacts = input.meetingArtifacts ?? [];
  const existingTasks = input.existingTasks ?? [];
  const seenTaskTitles = new Set(existingTasks.map((task) => normalize(task.title)));
  const generatedAt =
    meetingArtifacts[0]?.generatedAt ??
    input.engineeringSummary?.generatedAt ??
    new Date().toISOString();

  const tasks = [
    ...buildActionTasks(meetingArtifacts, seenTaskTitles),
    ...buildOpenQuestionTasks(meetingArtifacts, seenTaskTitles),
  ];

  return {
    tasks,
    alerts: buildWorkflowAlerts(
      meetingArtifacts,
      existingTasks,
      generatedAt,
      input.engineeringSummary
    ),
  };
}

function buildActionTasks(
  meetingArtifacts: MeetingArtifact[],
  seenTaskTitles: Set<string>
): SuggestedTask[] {
  const tasks: SuggestedTask[] = [];

  for (const artifact of meetingArtifacts) {
    for (const item of artifact.actionItems) {
      const title = item.title;
      const normalizedTitle = normalize(title);
      if (seenTaskTitles.has(normalizedTitle)) {
        continue;
      }

      seenTaskTitles.add(normalizedTitle);
      tasks.push({
        id: `task-workflow-${item.id}`,
        title,
        description: item.description,
        priority: item.owner ? "medium" : "high",
        suggestedOwner: item.owner,
        dueDate: item.dueDate,
        source: artifact.title,
        sourceAgentId: "workflow",
        status: "suggested",
        createdAt: artifact.generatedAt,
        metadata: {
          workflowOrigin: "meeting_action_item",
          sourceArtifactId: artifact.id,
          sourceActionItemId: item.id,
          ownerStatus: item.owner ? "assigned" : "missing",
          trackingStatus: "not_requested",
        },
      });
    }
  }

  return tasks;
}

function buildOpenQuestionTasks(
  meetingArtifacts: MeetingArtifact[],
  seenTaskTitles: Set<string>
): SuggestedTask[] {
  const tasks: SuggestedTask[] = [];

  for (const artifact of meetingArtifacts) {
    artifact.openQuestions.forEach((question, index) => {
      const title = `Resolve: ${question}`;
      const normalizedTitle = normalize(title);
      if (seenTaskTitles.has(normalizedTitle)) {
        return;
      }

      seenTaskTitles.add(normalizedTitle);
      tasks.push({
        id: `task-workflow-question-${artifact.id}-${index + 1}`,
        title,
        description:
          "An open question from the meeting is still unresolved and needs a clear owner or next step.",
        priority: "medium",
        source: artifact.title,
        sourceAgentId: "workflow",
        status: "suggested",
        createdAt: artifact.generatedAt,
        metadata: {
          workflowOrigin: "open_question",
          sourceArtifactId: artifact.id,
          ownerStatus: "missing",
          trackingStatus: "not_requested",
        },
      });
    });
  }

  return tasks;
}

function buildWorkflowAlerts(
  meetingArtifacts: MeetingArtifact[],
  existingTasks: SuggestedTask[],
  generatedAt: string,
  engineeringSummary?: WorkflowAgentInput["engineeringSummary"]
): RiskAlert[] {
  const alerts: RiskAlert[] = [];

  for (const artifact of meetingArtifacts) {
    const unownedActionItems = artifact.actionItems.filter((item) => !item.owner);
    if (unownedActionItems.length > 0) {
      alerts.push({
        id: `risk-workflow-unowned-${artifact.id}`,
        workspaceId: artifact.workspaceId,
        title: "Follow-up items missing owners",
        description: `${unownedActionItems.length} meeting action item(s) do not have a clear owner yet.`,
        severity: "medium",
        category: "workflow",
        sourceAgentId: "workflow",
        createdAt: artifact.generatedAt,
        relatedRecordIds: [artifact.id, ...unownedActionItems.map((item) => item.id)],
      });
    }

    if (artifact.openQuestions.length > 0) {
      alerts.push({
        id: `risk-workflow-open-questions-${artifact.id}`,
        workspaceId: artifact.workspaceId,
        title: "Open questions remain unresolved",
        description: `${artifact.openQuestions.length} question(s) were captured without a final resolution.`,
        severity: "low",
        category: "workflow",
        sourceAgentId: "workflow",
        createdAt: artifact.generatedAt,
        relatedRecordIds: [artifact.id],
      });
    }
  }

  const openTasks = existingTasks.filter((task) => task.status !== "completed");
  const overdueTasks = openTasks.filter(
    (task) => task.dueDate && new Date(task.dueDate).getTime() < Date.now()
  );
  if (overdueTasks.length > 0) {
    alerts.push({
      id: "risk-workflow-overdue-tasks",
      workspaceId: "workspace-authrix",
      title: "Follow-up tasks are overdue",
      description: `${overdueTasks.length} task(s) have passed their due date without being completed.`,
      severity: "high",
      category: "workflow",
      sourceAgentId: "workflow",
      createdAt: generatedAt,
      relatedRecordIds: overdueTasks.map((task) => task.id),
    });
  }

  const unownedHighPriorityTasks = openTasks.filter(
    (task) =>
      !task.suggestedOwner && (task.priority === "high" || task.priority === "critical")
  );
  if (unownedHighPriorityTasks.length > 0) {
    alerts.push({
      id: "risk-workflow-unowned-priority-tasks",
      workspaceId: "workspace-authrix",
      title: "Priority tasks are missing owners",
      description: `${unownedHighPriorityTasks.length} high-priority task(s) still need a clear owner.`,
      severity: "medium",
      category: "workflow",
      sourceAgentId: "workflow",
      createdAt: generatedAt,
      relatedRecordIds: unownedHighPriorityTasks.map((task) => task.id),
    });
  }

  if ((engineeringSummary?.riskFlags.length ?? 0) > 0 && meetingArtifacts.length === 0) {
    alerts.push({
      id: "risk-workflow-no-follow-up-context",
      workspaceId: "workspace-authrix",
      title: "Engineering risk lacks workflow follow-up",
      description:
        "Engineering risks were detected, but no meeting or workflow context exists yet to assign ownership.",
      severity: "medium",
      category: "workflow",
      sourceAgentId: "workflow",
      createdAt: new Date().toISOString(),
      relatedRecordIds: engineeringSummary?.riskFlags.map((flag) => flag.title) ?? [],
    });
  }

  return alerts;
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}
