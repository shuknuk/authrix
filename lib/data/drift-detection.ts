import type {
  ApprovalRequest,
  CostReport,
  DecisionRecord,
  EngineeringActivity,
  MeetingArtifact,
  RiskAlert,
  SourceDocument,
  SuggestedTask,
  TaskStatus,
} from "@/types/domain";

interface DriftDetectionInput {
  workspaceId: string;
  generatedAt: string;
  engineeringActivities: EngineeringActivity[];
  sourceDocuments: SourceDocument[];
  meetingArtifacts: MeetingArtifact[];
  decisionRecords: DecisionRecord[];
  costReport: CostReport;
  tasks: SuggestedTask[];
}

export function buildOperationalDriftAlerts(
  input: DriftDetectionInput
): RiskAlert[] {
  const alerts: RiskAlert[] = [];

  const docsAlert = buildDocumentationDriftAlert(input);
  if (docsAlert) {
    alerts.push(docsAlert);
  }

  const decisionAlert = buildDecisionFollowThroughAlert(input);
  if (decisionAlert) {
    alerts.push(decisionAlert);
  }

  const recurringQuestionAlert = buildRecurringQuestionAlert(input);
  if (recurringQuestionAlert) {
    alerts.push(recurringQuestionAlert);
  }

  const executionBacklogAlert = buildExecutionBacklogAlert(input);
  if (executionBacklogAlert) {
    alerts.push(executionBacklogAlert);
  }

  const opsMismatchAlert = buildOperationsMismatchAlert(input);
  if (opsMismatchAlert) {
    alerts.push(opsMismatchAlert);
  }

  return alerts;
}

export function buildApprovalDriftAlerts(input: {
  workspaceId: string;
  generatedAt: string;
  approvalRequests: ApprovalRequest[];
}): RiskAlert[] {
  const stalledApprovalAlert = buildStalledApprovalAlert(input);
  return stalledApprovalAlert ? [stalledApprovalAlert] : [];
}

function buildDocumentationDriftAlert(
  input: DriftDetectionInput
): RiskAlert | null {
  if (input.engineeringActivities.length === 0) {
    return null;
  }

  const latestDocumentTimestamp = input.sourceDocuments.reduce<number>(
    (latest, document) =>
      Math.max(latest, new Date(document.createdAt).getTime()),
    0
  );
  const changedActivities = input.engineeringActivities.filter(
    (activity) => new Date(activity.timestamp).getTime() > latestDocumentTimestamp
  );

  if (latestDocumentTimestamp > 0 && changedActivities.length === 0) {
    return null;
  }

  if (latestDocumentTimestamp === 0 && input.engineeringActivities.length < 3) {
    return null;
  }

  const severity = changedActivities.length >= 3 ? "medium" : "low";
  const impactedActivities =
    changedActivities.length > 0 ? changedActivities : input.engineeringActivities.slice(0, 3);

  return {
    id: "risk-drift-documentation-coverage",
    workspaceId: input.workspaceId,
    title: "Engineering changes lack fresh documentation",
    description:
      latestDocumentTimestamp === 0
        ? `${input.engineeringActivities.length} engineering activity record(s) exist without any persisted meeting notes or docs input yet.`
        : `${changedActivities.length} engineering activity record(s) landed after the latest persisted docs input. Authrix is seeing technical change faster than organizational memory is being refreshed.`,
    severity,
    category: "drift",
    sourceAgentId: "workflow",
    createdAt: input.generatedAt,
    relatedRecordIds: impactedActivities.map((activity) => activity.id),
  };
}

function buildDecisionFollowThroughAlert(
  input: DriftDetectionInput
): RiskAlert | null {
  const missingFollowThrough = input.decisionRecords.filter(
    (decision) => decision.status === "accepted" && decision.relatedTaskIds.length === 0
  );

  if (missingFollowThrough.length === 0) {
    return null;
  }

  return {
    id: "risk-drift-decision-follow-through",
    workspaceId: input.workspaceId,
    title: "Accepted decisions are missing follow-through",
    description: `${missingFollowThrough.length} accepted decision record(s) do not yet link to any follow-up task, which suggests organizational drift between decisions and execution.`,
    severity: missingFollowThrough.length > 1 ? "medium" : "low",
    category: "drift",
    sourceAgentId: "workflow",
    createdAt: input.generatedAt,
    relatedRecordIds: missingFollowThrough.map((decision) => decision.id),
  };
}

function buildRecurringQuestionAlert(
  input: DriftDetectionInput
): RiskAlert | null {
  const repeatedQuestions = new Map<
    string,
    { count: number; sample: string; artifactIds: string[] }
  >();

  for (const artifact of input.meetingArtifacts) {
    for (const question of artifact.openQuestions) {
      const normalized = normalize(question);
      const existing = repeatedQuestions.get(normalized);

      if (existing) {
        existing.count += 1;
        existing.artifactIds.push(artifact.id);
      } else {
        repeatedQuestions.set(normalized, {
          count: 1,
          sample: question,
          artifactIds: [artifact.id],
        });
      }
    }
  }

  const recurring = [...repeatedQuestions.values()].filter((entry) => entry.count > 1);
  if (recurring.length === 0) {
    return null;
  }

  const topRecurring = recurring[0];

  return {
    id: "risk-drift-recurring-questions",
    workspaceId: input.workspaceId,
    title: "Open questions are recurring across meetings",
    description:
      recurring.length === 1
        ? `The question "${topRecurring.sample}" has now appeared in ${topRecurring.count} meeting artifacts without a durable resolution.`
        : `${recurring.length} open-question themes are recurring across meetings, which suggests the team is revisiting the same unresolved topics.`,
    severity: recurring.length > 1 ? "medium" : "low",
    category: "drift",
    sourceAgentId: "docs",
    createdAt: input.generatedAt,
    relatedRecordIds: recurring.flatMap((entry) => entry.artifactIds),
  };
}

function buildExecutionBacklogAlert(
  input: DriftDetectionInput
): RiskAlert | null {
  const actionableTasks = input.tasks.filter((task) => isTaskActionable(task.status));
  const unownedTasks = actionableTasks.filter((task) => !task.suggestedOwner);
  const highPriorityTasks = actionableTasks.filter(
    (task) => task.priority === "high" || task.priority === "critical"
  );

  if (actionableTasks.length < 4) {
    return null;
  }

  return {
    id: "risk-drift-execution-backlog",
    workspaceId: input.workspaceId,
    title: "Execution backlog is accumulating",
    description:
      highPriorityTasks.length > 0
        ? `${actionableTasks.length} actionable task(s) are still open, including ${highPriorityTasks.length} high-priority item(s). ${unownedTasks.length > 0 ? `${unownedTasks.length} of them still need owners.` : "The follow-through queue is growing faster than tasks are being cleared."}`
        : `${actionableTasks.length} actionable task(s) are still open, which suggests follow-through is building up faster than it is being completed.`,
    severity: highPriorityTasks.length > 1 ? "medium" : "low",
    category: "drift",
    sourceAgentId: "workflow",
    createdAt: input.generatedAt,
    relatedRecordIds: actionableTasks.map((task) => task.id),
  };
}

function buildOperationsMismatchAlert(
  input: DriftDetectionInput
): RiskAlert | null {
  if (input.costReport.anomalies.length === 0) {
    return null;
  }

  const highImpactEngineeringChanges = input.engineeringActivities.filter(
    (activity) => activity.impact === "high"
  ).length;

  if (highImpactEngineeringChanges > 0) {
    return null;
  }

  return {
    id: "risk-drift-ops-mismatch",
    workspaceId: input.workspaceId,
    title: "Operational cost drift lacks matching product activity",
    description: `${input.costReport.anomalies.length} spend anomaly signal(s) were detected without any high-impact engineering change in the same operating window. Authrix should treat this as drift between resource usage and visible product work.`,
    severity: input.costReport.anomalies.length > 1 ? "medium" : "low",
    category: "drift",
    sourceAgentId: "devops",
    createdAt: input.generatedAt,
    relatedRecordIds: [input.costReport.id],
  };
}

function buildStalledApprovalAlert(input: {
  workspaceId: string;
  generatedAt: string;
  approvalRequests: ApprovalRequest[];
}): RiskAlert | null {
  const now = Date.now();
  const pendingApprovals = input.approvalRequests.filter(
    (approval) =>
      approval.status === "pending" &&
      now - new Date(approval.requestedAt).getTime() >= 1000 * 60 * 60 * 12
  );

  if (pendingApprovals.length === 0) {
    return null;
  }

  return {
    id: "risk-drift-stalled-approvals",
    workspaceId: input.workspaceId,
    title: "Approvals are stalling follow-through",
    description: `${pendingApprovals.length} approval request(s) have been pending for more than 12 hours, which can slow execution across docs, workflow, or ops actions.`,
    severity: pendingApprovals.length > 1 ? "medium" : "low",
    category: "drift",
    sourceAgentId: "workflow",
    createdAt: input.generatedAt,
    relatedRecordIds: pendingApprovals.map((approval) => approval.id),
  };
}

function isTaskActionable(status: TaskStatus): boolean {
  return status !== "completed" && status !== "rejected";
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}
