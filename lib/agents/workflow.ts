import type { WorkflowAgentInput, WorkflowAgentOutput } from "@/types/agents";
import type { MeetingArtifact, RiskAlert, SuggestedTask } from "@/types/domain";

export function workflowAgent(
  input: WorkflowAgentInput
): WorkflowAgentOutput {
  const meetingArtifacts = input.meetingArtifacts ?? [];
  const existingTasks = input.existingTasks ?? [];
  const seenTaskTitles = new Set(existingTasks.map((task) => normalize(task.title)));

  const tasks = [
    ...buildActionTasks(meetingArtifacts, seenTaskTitles),
    ...buildOpenQuestionTasks(meetingArtifacts, seenTaskTitles),
  ];

  return {
    tasks,
    alerts: buildWorkflowAlerts(meetingArtifacts, input.engineeringSummary),
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
      });
    });
  }

  return tasks;
}

function buildWorkflowAlerts(
  meetingArtifacts: MeetingArtifact[],
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
