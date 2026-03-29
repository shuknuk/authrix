import { devopsAgent, docsAgent } from "@/lib/agents";
import { runEngineerPipeline } from "@/lib/data/engineer-pipeline";
import { runTaskPipeline } from "@/lib/data/task-pipeline";
import { runWorkflowPipeline } from "@/lib/data/workflow-pipeline";
import {
  clearWorkspaceSnapshotCache,
  loadPersistedWorkspaceSnapshot,
  saveWorkspaceSnapshot,
  updatePersistedWorkspaceSnapshot,
} from "@/lib/data/workspace-store";
import { getAuth0IntegrationStatus, getGitHubIngestionResult } from "@/lib/github/service";
import { mockCostAnomalies, mockCostBreakdown, mockCostTotals } from "@/lib/mock/cost-data";
import { normalizeGitHubEvents } from "@/lib/mock/github-activity";
import { mockIntegrations } from "@/lib/mock/integrations";
import { mockMeetingDocuments } from "@/lib/mock/meeting-documents";
import type {
  AgentRunRecord,
  ApprovalRequest,
  ApprovalStatus,
  AuditEvent,
  CostReport,
  DecisionRecord,
  EngineeringActivity,
  EngineeringSummary,
  GitHubEvent,
  IntegrationStatus,
  MeetingArtifact,
  ProposedAction,
  RiskAlert,
  SourceDocument,
  SourceEvent,
  SuggestedTask,
  TimelineEntry,
  Workspace,
  WorkspacePipelineStatus,
  WorkspaceSnapshot,
} from "@/types/domain";
import type { AgentRunResult, DocsAgentOutput } from "@/types/agents";

const WORKSPACE_ID = "workspace-authrix";
const WORKSPACE_NAME = "Authrix";
const SUMMARY_PERIOD = {
  start: "2026-03-21T00:00:00Z",
  end: "2026-03-28T00:00:00Z",
};

type LocalExecution<T> = AgentRunResult<T> & {
  provider: "local";
  fallbackReason?: string;
  sessionId?: string;
};

interface CreateSourceDocumentInput {
  title: string;
  content: string;
  participants?: string[];
  sourceSystem?: SourceDocument["sourceSystem"];
  documentType?: SourceDocument["documentType"];
}

export async function getWorkspaceSnapshot(): Promise<WorkspaceSnapshot> {
  const persisted = await loadPersistedWorkspaceSnapshot();
  if (persisted) {
    return persisted;
  }

  return refreshWorkspaceSnapshot();
}

export async function getEngineeringSummary(): Promise<EngineeringSummary> {
  return (await getWorkspaceSnapshot()).engineeringSummary;
}

export async function getSuggestedTasks(): Promise<SuggestedTask[]> {
  return (await getWorkspaceSnapshot()).tasks;
}

export async function getCostReport(): Promise<CostReport> {
  return (await getWorkspaceSnapshot()).costReport;
}

export async function getApprovalRequests(): Promise<ApprovalRequest[]> {
  return (await getWorkspaceSnapshot()).approvalRequests;
}

export async function getApprovalRequestById(
  id: string
): Promise<ApprovalRequest | null> {
  return (await getWorkspaceSnapshot()).approvalRequests.find((item) => item.id === id) ?? null;
}

export async function getTimelineEntries(): Promise<TimelineEntry[]> {
  return (await getWorkspaceSnapshot()).timeline;
}

export async function getIntegrationStatuses(): Promise<IntegrationStatus[]> {
  return (await getWorkspaceSnapshot()).integrations;
}

export async function getMeetingArtifacts(): Promise<MeetingArtifact[]> {
  return (await getWorkspaceSnapshot()).meetingArtifacts;
}

export async function getDecisionRecords(): Promise<DecisionRecord[]> {
  return (await getWorkspaceSnapshot()).decisionRecords;
}

export async function getRiskAlerts(): Promise<RiskAlert[]> {
  return (await getWorkspaceSnapshot()).riskAlerts;
}

export async function getAgentRuns(): Promise<AgentRunRecord[]> {
  return (await getWorkspaceSnapshot()).agentRuns;
}

export async function getSourceDocuments(): Promise<SourceDocument[]> {
  return (await getWorkspaceSnapshot()).sourceDocuments;
}

export async function refreshWorkspaceSnapshot(): Promise<WorkspaceSnapshot> {
  clearWorkspaceSnapshotCache();
  const snapshot = await buildWorkspaceSnapshot();
  return saveWorkspaceSnapshot(snapshot);
}

export async function createSourceDocument(
  input: CreateSourceDocumentInput
): Promise<WorkspaceSnapshot> {
  const snapshot = await getWorkspaceSnapshot();
  const now = new Date().toISOString();
  const document: SourceDocument = {
    id: `source-document-${Date.now()}`,
    workspaceId: WORKSPACE_ID,
    sourceSystem: input.sourceSystem ?? "manual",
    documentType: input.documentType ?? "notes",
    title: input.title,
    createdAt: now,
    content: input.content,
    participants: input.participants ?? [],
    metadata: {
      persistedBy: "api",
    },
  };

  await saveWorkspaceSnapshot({
    ...snapshot,
    sourceDocuments: [document, ...snapshot.sourceDocuments],
    state: {
      ...snapshot.state,
      refreshedAt: now,
    },
  });

  return refreshWorkspaceSnapshot();
}

export async function updateWorkspaceCostReport(
  report: CostReport
): Promise<WorkspaceSnapshot> {
  const snapshot = await getWorkspaceSnapshot();
  const now = new Date().toISOString();

  await saveWorkspaceSnapshot({
    ...snapshot,
    costReport: {
      ...report,
      generatedAt: report.generatedAt || now,
    },
    state: {
      ...snapshot.state,
      refreshedAt: now,
    },
  });

  return refreshWorkspaceSnapshot();
}

export async function updateApprovalRequest(
  id: string,
  status: Exclude<ApprovalStatus, "pending">,
  resolvedBy = "current-user"
): Promise<ApprovalRequest | null> {
  const updatedSnapshot = await updatePersistedWorkspaceSnapshot((snapshot) => {
    const approval = snapshot.approvalRequests.find((item) => item.id === id);
    if (!approval) {
      return snapshot;
    }

    approval.status = status;
    approval.resolvedAt = new Date().toISOString();
    approval.resolvedBy = resolvedBy;
    approval.executionResult =
      status === "approved"
        ? "Approved for mediated execution."
        : "Rejected before any external action was executed.";

    if (approval.proposedActionId) {
      const action = snapshot.proposedActions.find(
        (item) => item.id === approval.proposedActionId
      );
      if (action) {
        action.status = status;
      }
    }

    for (const relatedRecordId of approval.relatedRecordIds ?? []) {
      const task = snapshot.tasks.find((item) => item.id === relatedRecordId);
      if (task) {
        task.status = status === "approved" ? "approved" : "rejected";
      }
    }

    const auditEvent: AuditEvent = {
      id: `audit-approval-${approval.id}-${approval.status}`,
      workspaceId: WORKSPACE_ID,
      action: `approval.${approval.status}`,
      actor: resolvedBy,
      target: approval.affectedSystem,
      details: `${approval.title} was ${approval.status}.`,
      timestamp: approval.resolvedAt,
      metadata: {
        approvalId: approval.id,
        actionKind: approval.actionKind,
        sourceAgent: approval.sourceAgent,
      },
      relatedRecordIds: approval.relatedRecordIds ?? [],
    };

    snapshot.auditEvents.unshift(auditEvent);
    snapshot.timeline.unshift({
      id: `timeline-${approval.id}-${approval.status}`,
      type: "approval",
      title: approval.title,
      description: `${approval.title} was ${approval.status} by ${resolvedBy}.`,
      source: "approval-engine",
      timestamp: approval.resolvedAt,
      metadata: {
        status: approval.status,
        riskLevel: approval.riskLevel,
        affectedSystem: approval.affectedSystem,
      },
      relatedRecordIds: approval.relatedRecordIds,
    });

    snapshot.state = {
      ...snapshot.state,
      refreshedAt: new Date().toISOString(),
    };

    return snapshot;
  });

  if (!updatedSnapshot) {
    return null;
  }

  return updatedSnapshot.approvalRequests.find((item) => item.id === id) ?? null;
}

export async function recordApprovalExecutionResult(
  id: string,
  input: {
    success: boolean;
    message: string;
    metadata?: Record<string, unknown>;
  }
): Promise<ApprovalRequest | null> {
  const updatedSnapshot = await updatePersistedWorkspaceSnapshot((snapshot) => {
    const approval = snapshot.approvalRequests.find((item) => item.id === id);
    if (!approval) {
      return snapshot;
    }

    const timestamp = new Date().toISOString();
    approval.executionResult = input.message;

    if (approval.proposedActionId && input.success) {
      const action = snapshot.proposedActions.find(
        (item) => item.id === approval.proposedActionId
      );
      if (action) {
        action.status = "executed";
      }
    }

    snapshot.auditEvents.unshift({
      id: `audit-approval-execution-${approval.id}-${timestamp}`,
      workspaceId: WORKSPACE_ID,
      action: input.success ? "approval.execution.completed" : "approval.execution.failed",
      actor: approval.resolvedBy ?? approval.sourceAgent,
      target: approval.affectedSystem,
      details: input.message,
      timestamp,
      metadata: {
        approvalId: approval.id,
        ...(input.metadata ?? {}),
      },
      relatedRecordIds: approval.relatedRecordIds,
    });

    snapshot.timeline.unshift({
      id: `timeline-approval-execution-${approval.id}-${timestamp}`,
      type: "approval_execution",
      title: approval.title,
      description: input.message,
      source: approval.sourceAgent,
      timestamp,
      metadata: {
        success: input.success,
        ...(input.metadata ?? {}),
      },
      relatedRecordIds: approval.relatedRecordIds,
    });

    snapshot.state = {
      ...snapshot.state,
      refreshedAt: timestamp,
    };

    return snapshot;
  });

  if (!updatedSnapshot) {
    return null;
  }

  return updatedSnapshot.approvalRequests.find((item) => item.id === id) ?? null;
}

async function buildWorkspaceSnapshot(): Promise<WorkspaceSnapshot> {
  const refreshedAt = new Date().toISOString();
  const existingSnapshot = await loadPersistedWorkspaceSnapshot();
  const githubIngestion = await getGitHubIngestionResult();
  const integrations = buildIntegrationStatuses(githubIngestion.integration);
  const workspace: Workspace = {
    id: WORKSPACE_ID,
    name: WORKSPACE_NAME,
    createdAt: "2026-03-20T09:00:00Z",
    integrations,
  };

  const sourceEvents = buildSourceEvents(githubIngestion.events);
  const sourceDocuments = resolveSourceDocuments(existingSnapshot);
  const engineeringActivities = getEngineeringActivities(githubIngestion.events);

  const engineerRun = await executeEngineerAgent(engineeringActivities);
  const docsRuns = sourceDocuments.map((document) =>
    executeDocsAgent(document, engineerRun.output.summary)
  );

  const meetingArtifacts = docsRuns.map((run) => run.output.artifact);
  let decisionRecords = docsRuns.flatMap((run) => run.output.decisions);

  const taskRun = await executeTaskAgent(engineerRun.output.summary);
  const workflowRun = await executeWorkflowAgent(
    engineerRun.output.summary,
    meetingArtifacts,
    taskRun.output.tasks
  );

  const tasks = sortTasks([...taskRun.output.tasks, ...workflowRun.output.tasks]);
  decisionRecords = linkDecisionsToTasks(decisionRecords, meetingArtifacts, tasks);

  const persistedCostReport = existingSnapshot?.costReport;
  const devopsRun = executeDevopsAgent(persistedCostReport);
  const riskAlerts = sortRiskAlerts([
    ...buildEngineeringRiskAlerts(engineerRun.output.summary),
    ...workflowRun.output.alerts,
    ...buildOperationsRiskAlerts(devopsRun.output.report),
  ]);

  const proposedActions = buildProposedActions(
    tasks,
    decisionRecords,
    riskAlerts,
    meetingArtifacts
  );
  const approvalRequests = buildApprovalRequests(proposedActions);

  for (const action of proposedActions) {
    const approval = approvalRequests.find(
      (request) => request.proposedActionId === action.id
    );
    if (approval) {
      action.approvalRequestId = approval.id;
    }
  }

  const pipelines = buildPipelineStatuses({
    refreshedAt,
    githubIntegration: githubIngestion.integration,
    engineerPipeline: engineerRun.pipelineStatus,
    taskPipeline: taskRun.pipelineStatus,
    workflowPipeline: workflowRun.pipelineStatus,
    hasPersistedDocuments: Boolean(existingSnapshot?.sourceDocuments.length),
    hasPersistedCostReport: Boolean(
      existingSnapshot?.costReport && existingSnapshot.costReport.breakdown.length > 0
    ),
  });
  const agentRuns = buildAgentRuns(
    engineerRun,
    docsRuns,
    taskRun,
    workflowRun,
    devopsRun
  );
  const auditEvents = buildAuditEvents(agentRuns, approvalRequests);
  const timeline = buildTimeline({
    sourceEvents,
    meetingArtifacts,
    decisionRecords,
    riskAlerts,
    approvalRequests,
    auditEvents,
  });

  return {
    workspace,
    state: {
      storage: "filesystem",
      refreshedAt,
      persistedAt: refreshedAt,
      pipelines,
    },
    integrations,
    sourceEvents,
    sourceDocuments,
    engineeringActivities,
    engineeringSummary: engineerRun.output.summary,
    meetingArtifacts,
    decisionRecords,
    tasks,
    costReport: devopsRun.output.report,
    riskAlerts,
    proposedActions,
    approvalRequests,
    auditEvents,
    agentRuns,
    timeline,
  };
}

function buildSourceEvents(events: GitHubEvent[]): SourceEvent[] {
  return [...events]
    .sort(sortByDateDesc("timestamp"))
    .map((event) => ({
      id: `source-${event.id}`,
      workspaceId: WORKSPACE_ID,
      sourceSystem: "github",
      eventType: event.type,
      title: event.title,
      description: event.description,
      occurredAt: event.timestamp,
      actor: event.author,
      url: event.url,
      externalId: event.id,
      metadata: event.metadata,
    }));
}

function getEngineeringActivities(events: GitHubEvent[]): EngineeringActivity[] {
  return normalizeGitHubEvents(events).sort(sortByDateDesc("timestamp"));
}

function cloneIntegrations(integrations: IntegrationStatus[]): IntegrationStatus[] {
  return integrations.map((integration) => ({
    ...integration,
    scopes: integration.scopes ? [...integration.scopes] : undefined,
  }));
}

function buildIntegrationStatuses(
  githubIntegration: IntegrationStatus
): IntegrationStatus[] {
  const baseIntegrations = cloneIntegrations(mockIntegrations).filter(
    (integration) => integration.service !== "GitHub" && integration.service !== "Auth0"
  );

  return [getAuth0IntegrationStatus(), githubIntegration, ...baseIntegrations];
}

function cloneSourceDocuments(documents: SourceDocument[]): SourceDocument[] {
  return documents.map((document) => ({
    ...document,
    participants: [...document.participants],
    transcript: document.transcript
      ? document.transcript.map((entry) => ({ ...entry }))
      : undefined,
    metadata: { ...document.metadata },
  }));
}

function resolveSourceDocuments(
  existingSnapshot: WorkspaceSnapshot | null
): SourceDocument[] {
  if (existingSnapshot?.sourceDocuments.length) {
    return cloneSourceDocuments(existingSnapshot.sourceDocuments);
  }

  return cloneSourceDocuments(mockMeetingDocuments);
}

async function executeEngineerAgent(
  activities: EngineeringActivity[]
): Promise<Awaited<ReturnType<typeof runEngineerPipeline>>> {
  return runEngineerPipeline({
    activities,
    period: SUMMARY_PERIOD,
  });
}

function executeDocsAgent(
  sourceDocument: SourceDocument,
  engineeringSummary: EngineeringSummary
): LocalExecution<DocsAgentOutput> {
  return {
    agentId: "docs",
    output: docsAgent({ sourceDocument, engineeringSummary }),
    executionTimeMs: 64,
    timestamp: sourceDocument.createdAt,
    provider: "local",
    fallbackReason:
      "Docs processing still uses local typed logic until the runtime-backed docs path is enabled.",
  };
}

async function executeTaskAgent(
  summary: EngineeringSummary
): Promise<Awaited<ReturnType<typeof runTaskPipeline>>> {
  return runTaskPipeline({ summary });
}

async function executeWorkflowAgent(
  engineeringSummary: EngineeringSummary,
  meetingArtifacts: MeetingArtifact[],
  existingTasks: SuggestedTask[]
): Promise<Awaited<ReturnType<typeof runWorkflowPipeline>>> {
  return runWorkflowPipeline({
    engineeringSummary,
    meetingArtifacts,
    existingTasks,
  });
}

function executeDevopsAgent(existingReport?: CostReport): LocalExecution<{ report: CostReport }> {
  if (existingReport && existingReport.breakdown.length > 0) {
    return {
      agentId: "devops",
      output: { report: cloneCostReport(existingReport) },
      executionTimeMs: 12,
      timestamp: existingReport.generatedAt,
      provider: "local",
      fallbackReason:
        "Using the persisted cost report until live billing ingestion is connected.",
    };
  }

  return {
    agentId: "devops",
    output: devopsAgent({
      costBreakdown: mockCostBreakdown,
      anomalies: mockCostAnomalies,
      period: mockCostTotals.period,
      totalSpend: mockCostTotals.totalSpend,
      currency: mockCostTotals.currency,
    }),
    executionTimeMs: 39,
    timestamp: new Date().toISOString(),
    provider: "local",
    fallbackReason:
      "DevOps reporting still uses the bundled cost dataset until live billing or manual cost inputs are provided.",
  };
}

function buildPipelineStatuses(input: {
  refreshedAt: string;
  githubIntegration: IntegrationStatus;
  engineerPipeline: WorkspacePipelineStatus;
  taskPipeline: WorkspacePipelineStatus;
  workflowPipeline: WorkspacePipelineStatus;
  hasPersistedDocuments: boolean;
  hasPersistedCostReport: boolean;
}): WorkspacePipelineStatus[] {
  const githubPipeline: WorkspacePipelineStatus = {
    id: "github-ingestion",
    label: "GitHub ingestion",
    provider: input.githubIntegration.mode === "mock" ? "mock" : "github",
    health:
      input.githubIntegration.status === "error"
        ? "error"
        : input.githubIntegration.mode === "mock"
          ? "fallback"
          : "ready",
    message:
      input.githubIntegration.description ??
      "GitHub ingestion pipeline status is available through the integration layer.",
    updatedAt: input.githubIntegration.lastSyncedAt ?? input.refreshedAt,
  };

  return [
    githubPipeline,
    input.engineerPipeline,
    input.taskPipeline,
    input.workflowPipeline,
    {
      id: "docs-processing",
      label: "Docs processing",
      provider: "local",
      health: input.hasPersistedDocuments ? "ready" : "fallback",
      message: input.hasPersistedDocuments
        ? "Docs processing is using persisted source documents."
        : "Docs processing is using bundled fallback documents until real source documents are added.",
      updatedAt: input.refreshedAt,
    },
    {
      id: "devops-signals",
      label: "DevOps signals",
      provider: input.hasPersistedCostReport ? "local" : "mock",
      health: input.hasPersistedCostReport ? "ready" : "fallback",
      message: input.hasPersistedCostReport
        ? "DevOps signals are using a persisted cost report."
        : "DevOps signals are still using the bundled fallback dataset until a cost report is persisted.",
      updatedAt: input.refreshedAt,
    },
  ];
}

function buildEngineeringRiskAlerts(summary: EngineeringSummary): RiskAlert[] {
  return summary.riskFlags.map((flag, index) => ({
    id: `risk-engineering-${index + 1}`,
    workspaceId: WORKSPACE_ID,
    title: flag.title,
    description: flag.description,
    severity: flag.severity,
    category: "engineering",
    sourceAgentId: "engineer",
    createdAt: summary.generatedAt,
    relatedRecordIds: flag.relatedActivityIds,
  }));
}

function buildOperationsRiskAlerts(report: CostReport): RiskAlert[] {
  return report.anomalies.map((anomaly, index) => ({
    id: `risk-operations-${index + 1}`,
    workspaceId: WORKSPACE_ID,
    title: `${anomaly.service} spend anomaly`,
    description: anomaly.description,
    severity: anomaly.severity,
    category: "operations",
    sourceAgentId: "devops",
    createdAt: anomaly.detectedAt,
    relatedRecordIds: [report.id],
  }));
}

function buildProposedActions(
  tasks: SuggestedTask[],
  decisionRecords: DecisionRecord[],
  riskAlerts: RiskAlert[],
  meetingArtifacts: MeetingArtifact[]
): ProposedAction[] {
  const operationsAlert = riskAlerts.find((alert) => alert.category === "operations");
  const highPriorityTask = tasks.find(
    (task) => task.priority === "critical" || task.priority === "high"
  );
  const documentationDecision = decisionRecords[0];
  const meetingArtifact = meetingArtifacts[0];

  const actions: ProposedAction[] = [];

  if (operationsAlert) {
    actions.push({
      id: "proposed-action-001",
      workspaceId: WORKSPACE_ID,
      actionKind: "github.issue.create",
      title: "Create follow-up issue for cost anomaly",
      description:
        "The DevOps agent detected a rising spend pattern and wants to create a tracking issue for follow-up.",
      targetSystem: "GitHub",
      riskLevel: "medium",
      sourceAgentId: "devops",
      status: "proposed",
      createdAt: operationsAlert.createdAt,
      relatedRecordIds: [operationsAlert.id],
    });
  }

  if (highPriorityTask) {
    actions.push({
      id: "proposed-action-002",
      workspaceId: WORKSPACE_ID,
      actionKind: "github.issue.create",
      title: "Create task: review approval engine PR",
      description:
        "The workflow layer identified a follow-up worth tracking in GitHub so it does not drift out of sight.",
      targetSystem: "GitHub",
      riskLevel: "medium",
      sourceAgentId: highPriorityTask.sourceAgentId,
      status: "proposed",
      createdAt: highPriorityTask.createdAt,
      relatedRecordIds: [highPriorityTask.id],
    });
  }

  if (documentationDecision) {
    actions.push({
      id: "proposed-action-003",
      workspaceId: WORKSPACE_ID,
      actionKind: "docs.update",
      title: "Update architecture docs with new security model",
      description:
        "Docs should be refreshed so the delegated access model stays aligned with the latest product decisions.",
      targetSystem: "Documentation",
      riskLevel: "low",
      sourceAgentId: "docs",
      status: "approved",
      createdAt: meetingArtifact?.generatedAt ?? documentationDecision.createdAt,
      relatedRecordIds: [
        documentationDecision.id,
        ...(meetingArtifact ? [meetingArtifact.id] : []),
      ],
    });
  }

  return actions;
}

function buildApprovalRequests(
  proposedActions: ProposedAction[]
): ApprovalRequest[] {
  return proposedActions
    .map((action, index): ApprovalRequest => {
      const status: ApprovalStatus =
        action.status === "approved" ? "approved" : "pending";

      return {
        id: `approval-00${index + 1}`,
        actionKind: action.actionKind,
        title: action.title,
        description: action.description,
        sourceAgent: action.sourceAgentId,
        affectedSystem: action.targetSystem,
        riskLevel: action.riskLevel,
        status,
        requestedAt: action.createdAt,
        proposedActionId: action.id,
        resolvedAt:
          action.status === "approved" ? "2026-03-28T10:15:00Z" : undefined,
        resolvedBy: action.status === "approved" ? "kinshuk" : undefined,
        executionResult:
          action.status === "approved"
            ? "Approved for controlled documentation update."
            : undefined,
        relatedRecordIds: [...action.relatedRecordIds],
      };
    })
    .sort(sortByDateDesc("requestedAt"));
}

function linkDecisionsToTasks(
  decisionRecords: DecisionRecord[],
  meetingArtifacts: MeetingArtifact[],
  tasks: SuggestedTask[]
): DecisionRecord[] {
  return decisionRecords.map((decision) => {
    const relatedArtifact = meetingArtifacts.find(
      (artifact) => artifact.sourceDocumentId === decision.sourceDocumentId
    );

    const relatedTaskIds = relatedArtifact
      ? tasks
          .filter((task) => task.source === relatedArtifact.title)
          .map((task) => task.id)
      : [];

    return {
      ...decision,
      relatedTaskIds,
    };
  });
}

function buildAgentRuns(
  engineerRun: Awaited<ReturnType<typeof runEngineerPipeline>>,
  docsRuns: LocalExecution<DocsAgentOutput>[],
  taskRun: Awaited<ReturnType<typeof runTaskPipeline>>,
  workflowRun: Awaited<ReturnType<typeof runWorkflowPipeline>>,
  devopsRun: LocalExecution<{ report: CostReport }>
): AgentRunRecord[] {
  const records: AgentRunRecord[] = [
    {
      id: "agent-run-engineer-001",
      workspaceId: WORKSPACE_ID,
      agentId: "engineer",
      status: "completed",
      startedAt: engineerRun.timestamp,
      completedAt: engineerRun.timestamp,
      inputSummary: `${engineerRun.output.summary.activityCount} engineering activities normalized.`,
      outputSummary: `Generated summary with ${engineerRun.output.summary.highlights.length} highlights and ${engineerRun.output.summary.riskFlags.length} risk flags.`,
      provider: engineerRun.provider,
      runtimeSessionId: engineerRun.sessionId,
      fallbackReason: engineerRun.fallbackReason,
      relatedRecordIds: [
        engineerRun.output.summary.id,
        ...engineerRun.output.summary.highlights.flatMap(
          (highlight) => highlight.relatedActivityIds
        ),
      ],
    },
    ...docsRuns.map((run, index) => ({
      id: `agent-run-docs-00${index + 1}`,
      workspaceId: WORKSPACE_ID,
      agentId: run.agentId,
      status: "completed" as const,
      startedAt: run.timestamp,
      completedAt: run.timestamp,
      inputSummary: `Processed meeting document ${run.output.artifact.sourceDocumentId}.`,
      outputSummary: `Created ${run.output.decisions.length} decisions and ${run.output.artifact.actionItems.length} action items.`,
      provider: run.provider,
      fallbackReason: run.fallbackReason,
      relatedRecordIds: [
        run.output.artifact.id,
        ...run.output.decisions.map((decision) => decision.id),
      ],
    })),
    {
      id: "agent-run-task-001",
      workspaceId: WORKSPACE_ID,
      agentId: "task",
      status: "completed",
      startedAt: taskRun.timestamp,
      completedAt: taskRun.timestamp,
      inputSummary: "Generated task suggestions from the weekly engineering summary.",
      outputSummary: `Created ${taskRun.output.tasks.length} engineering follow-up tasks.`,
      provider: taskRun.provider,
      runtimeSessionId: taskRun.sessionId,
      fallbackReason: taskRun.fallbackReason,
      relatedRecordIds: taskRun.output.tasks.map((task) => task.id),
    },
    {
      id: "agent-run-workflow-001",
      workspaceId: WORKSPACE_ID,
      agentId: "workflow",
      status: "completed",
      startedAt: workflowRun.timestamp,
      completedAt: workflowRun.timestamp,
      inputSummary: "Operationalized meeting outputs into ownership and follow-up.",
      outputSummary: `Created ${workflowRun.output.tasks.length} workflow task(s) and ${workflowRun.output.alerts.length} workflow alert(s).`,
      provider: workflowRun.provider,
      runtimeSessionId: workflowRun.sessionId,
      fallbackReason: workflowRun.fallbackReason,
      relatedRecordIds: [
        ...workflowRun.output.tasks.map((task) => task.id),
        ...workflowRun.output.alerts.map((alert) => alert.id),
      ],
    },
    {
      id: "agent-run-devops-001",
      workspaceId: WORKSPACE_ID,
      agentId: devopsRun.agentId,
      status: "completed",
      startedAt: devopsRun.timestamp,
      completedAt: devopsRun.timestamp,
      inputSummary: `${devopsRun.output.report.breakdown.length} cost services analyzed.`,
      outputSummary: `Generated cost report with ${devopsRun.output.report.anomalies.length} anomaly signal(s).`,
      provider: devopsRun.provider,
      fallbackReason: devopsRun.fallbackReason,
      relatedRecordIds: [devopsRun.output.report.id],
    },
  ];

  return records.sort(sortByDateDesc("startedAt"));
}

function buildAuditEvents(
  agentRuns: AgentRunRecord[],
  approvalRequests: ApprovalRequest[]
): AuditEvent[] {
  const agentAuditEvents = agentRuns.map((run) => ({
    id: `audit-${run.id}`,
    workspaceId: WORKSPACE_ID,
    action: "agent.run.completed",
    actor: run.agentId,
    target: `agent:${run.agentId}`,
    details: run.outputSummary,
    timestamp: run.completedAt ?? run.startedAt,
    metadata: {
      agentRunId: run.id,
      status: run.status,
      provider: run.provider,
      fallbackReason: run.fallbackReason,
    },
    relatedRecordIds: run.relatedRecordIds,
  }));

  const approvalAuditEvents = approvalRequests
    .filter((approval) => approval.status !== "pending")
    .map((approval) => ({
      id: `audit-${approval.id}`,
      workspaceId: WORKSPACE_ID,
      action: `approval.${approval.status}`,
      actor: approval.resolvedBy ?? approval.sourceAgent,
      target: approval.affectedSystem,
      details: `${approval.title} was ${approval.status}.`,
      timestamp: approval.resolvedAt ?? approval.requestedAt,
      metadata: {
        approvalId: approval.id,
        actionKind: approval.actionKind,
      },
      relatedRecordIds: approval.relatedRecordIds,
    }));

  return [...approvalAuditEvents, ...agentAuditEvents].sort(
    sortByDateDesc("timestamp")
  );
}

function buildTimeline(input: {
  sourceEvents: SourceEvent[];
  meetingArtifacts: MeetingArtifact[];
  decisionRecords: DecisionRecord[];
  riskAlerts: RiskAlert[];
  approvalRequests: ApprovalRequest[];
  auditEvents: AuditEvent[];
}): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    ...input.sourceEvents.map((event) => ({
      id: `timeline-${event.id}`,
      type: event.eventType,
      title: event.title,
      description: event.description,
      source: event.sourceSystem,
      timestamp: event.occurredAt,
      metadata: {
        actor: event.actor,
        url: event.url,
      },
      relatedRecordIds: [event.id],
    })),
    ...input.meetingArtifacts.map((artifact) => ({
      id: `timeline-${artifact.id}`,
      type: "meeting_artifact",
      title: artifact.title,
      description: artifact.summary,
      source: "docs",
      timestamp: artifact.generatedAt,
      metadata: {
        participants: artifact.participants.join(", "),
      },
      relatedRecordIds: [artifact.id, ...artifact.actionItems.map((item) => item.id)],
    })),
    ...input.decisionRecords.map((decision) => ({
      id: `timeline-${decision.id}`,
      type: "decision",
      title: decision.title,
      description: decision.summary,
      source: decision.sourceAgentId,
      timestamp: decision.createdAt,
      metadata: {
        status: decision.status,
      },
      relatedRecordIds: [decision.id, ...decision.relatedTaskIds],
    })),
    ...input.riskAlerts.map((alert) => ({
      id: `timeline-${alert.id}`,
      type: "risk_alert",
      title: alert.title,
      description: alert.description,
      source: alert.sourceAgentId,
      timestamp: alert.createdAt,
      metadata: {
        severity: alert.severity,
        category: alert.category,
      },
      relatedRecordIds: alert.relatedRecordIds,
    })),
    ...input.approvalRequests.map((approval) => ({
      id: `timeline-${approval.id}`,
      type: "approval",
      title: approval.title,
      description:
        approval.status === "pending"
          ? `Approval requested for ${approval.actionKind}.`
          : `${approval.title} was ${approval.status}.`,
      source: approval.sourceAgent,
      timestamp: approval.resolvedAt ?? approval.requestedAt,
      metadata: {
        status: approval.status,
        riskLevel: approval.riskLevel,
      },
      relatedRecordIds: approval.relatedRecordIds,
    })),
    ...input.auditEvents.map((event) => ({
      id: `timeline-${event.id}`,
      type: "audit",
      title: event.action,
      description: event.details,
      source: event.actor,
      timestamp: event.timestamp,
      metadata: event.metadata,
      relatedRecordIds: event.relatedRecordIds,
    })),
  ];

  return entries.sort(sortByDateDesc("timestamp"));
}

function cloneCostReport(report: CostReport): CostReport {
  return {
    ...report,
    period: { ...report.period },
    breakdown: report.breakdown.map((entry) => ({ ...entry })),
    anomalies: report.anomalies.map((entry) => ({ ...entry })),
  };
}

function sortTasks(tasks: SuggestedTask[]): SuggestedTask[] {
  const priorityOrder: Record<SuggestedTask["priority"], number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  return [...tasks].sort((left, right) => {
    const priorityDelta = priorityOrder[left.priority] - priorityOrder[right.priority];
    if (priorityDelta !== 0) {
      return priorityDelta;
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

function sortRiskAlerts(alerts: RiskAlert[]): RiskAlert[] {
  const severityOrder: Record<RiskAlert["severity"], number> = {
    high: 0,
    medium: 1,
    low: 2,
  };

  return [...alerts].sort((left, right) => {
    const severityDelta = severityOrder[left.severity] - severityOrder[right.severity];
    if (severityDelta !== 0) {
      return severityDelta;
    }

    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

function sortByDateDesc<T>(field: keyof T) {
  return (left: T, right: T) =>
    new Date(String(right[field])).getTime() -
    new Date(String(left[field])).getTime();
}
