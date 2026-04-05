import { devopsAgent } from "@/lib/agents";
import { runDocsPipeline, type DocsPipelineExecution } from "@/lib/data/docs-pipeline";
import {
  buildApprovalDriftAlerts,
  buildOperationalDriftAlerts,
} from "@/lib/data/drift-detection";
import { runEngineerPipeline } from "@/lib/data/engineer-pipeline";
import { runModelDevopsAgent } from "@/lib/models/agent-execution";
import { getModelProvider } from "@/lib/models/provider";
import { getDefaultModelForAgent } from "@/lib/models/registry";
import { runTaskPipeline } from "@/lib/data/task-pipeline";
import { runWorkflowPipeline } from "@/lib/data/workflow-pipeline";
import {
  clearWorkspaceSnapshotCache,
  loadPersistedWorkspaceSnapshot,
  saveWorkspaceSnapshot,
  updatePersistedWorkspaceSnapshot,
} from "@/lib/data/workspace-store";
import { getAuth0IntegrationStatus, getGitHubIngestionResult } from "@/lib/github/service";
import { loadFinanceIngestion } from "@/lib/finance/ingestion";
import {
  buildAgentHandoffRecords,
  buildWorkspaceMemoryRecords,
  compactRecentRuntimeSessions,
  countResumableRuntimeSessions,
} from "@/lib/memory/service";
import { normalizeGitHubEvents } from "@/lib/mock/github-activity";
import { mockIntegrations } from "@/lib/mock/integrations";
import { mockMeetingDocuments } from "@/lib/mock/meeting-documents";
import { getNotionIntegrationStatus } from "@/lib/notion/service";
import { getSlackIntegrationStatus } from "@/lib/slack/service";
import { loadSlackWorkspaceState } from "@/lib/slack/store";
import { syncWorkflowFollowUpRecords } from "@/lib/workflow/follow-up";
import type {
  AgentHandoffRecord,
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
  TranscriptEntry,
  Workspace,
  WorkspaceMemoryRecord,
  WorkspacePipelineStatus,
  WorkspaceSnapshot,
} from "@/types/domain";
import type { AgentRunResult } from "@/types/agents";

const WORKSPACE_ID = "workspace-authrix";
const WORKSPACE_NAME = "Authrix";
const SUMMARY_PERIOD = {
  start: "2026-03-21T00:00:00Z",
  end: "2026-03-28T00:00:00Z",
};

type LocalExecution<T> = AgentRunResult<T> & {
  provider: "local" | "model";
  fallbackReason?: string;
  sessionId?: string;
};

interface CreateSourceDocumentInput {
  title: string;
  content?: string;
  participants?: string[];
  sourceSystem?: SourceDocument["sourceSystem"];
  documentType?: SourceDocument["documentType"];
  transcript?: TranscriptEntry[];
  metadata?: Record<string, unknown>;
}

interface CreateSourceDocumentResult {
  snapshot: WorkspaceSnapshot;
  document: SourceDocument;
  artifact: MeetingArtifact | null;
  decisions: DecisionRecord[];
  tasks: SuggestedTask[];
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

export async function updateTaskRecord(
  id: string,
  input: {
    status?: SuggestedTask["status"];
    suggestedOwner?: string | null;
    dueDate?: string | null;
  },
  actor = "current-user"
): Promise<SuggestedTask | null> {
  const updatedSnapshot = await updatePersistedWorkspaceSnapshot((snapshot) => {
    const task = snapshot.tasks.find((item) => item.id === id);
    if (!task) {
      return snapshot;
    }

    if (input.status) {
      task.status = input.status;
    }

    if ("suggestedOwner" in input) {
      task.suggestedOwner = input.suggestedOwner ?? undefined;
    }

    if ("dueDate" in input) {
      task.dueDate = input.dueDate ?? undefined;
    }

    const timestamp = new Date().toISOString();
    snapshot.auditEvents.unshift({
      id: `audit-task-${task.id}-${timestamp}`,
      workspaceId: WORKSPACE_ID,
      action: "task.updated",
      actor,
      target: task.id,
      details: `${task.title} was updated in workflow follow-through.`,
      timestamp,
      metadata: {
        status: task.status,
        suggestedOwner: task.suggestedOwner,
        dueDate: task.dueDate,
      },
      relatedRecordIds: [task.id],
    });

    snapshot.timeline.unshift({
      id: `timeline-task-${task.id}-${timestamp}`,
      type: "task_update",
      title: task.title,
      description: `${task.title} was updated by ${actor}.`,
      source: "workflow",
      timestamp,
      metadata: {
        status: task.status,
        suggestedOwner: task.suggestedOwner,
        dueDate: task.dueDate,
      },
      relatedRecordIds: [task.id],
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

  let finalSnapshot = updatedSnapshot;
  let task = finalSnapshot.tasks.find((item) => item.id === id) ?? null;
  if (task && input.status === "approved" && shouldQueueWorkflowIssueApproval(task)) {
    const approvalBundle = await createLiveApprovalRequest({
      actionKind: "github.issue.create",
      title: buildWorkflowIssueTitle(task),
      description: buildWorkflowIssueDescription(task),
      sourceAgent: "workflow",
      affectedSystem: "GitHub",
      riskLevel: mapTaskPriorityToRisk(task.priority),
      metadata: {
        taskId: task.id,
        taskTitle: task.title,
        repository: getDefaultGitHubRepository(),
      },
    });

    if (approvalBundle) {
      const snapshotWithTracking = await updatePersistedWorkspaceSnapshot((snapshot) => {
        const targetTask = snapshot.tasks.find((item) => item.id === id);
        if (!targetTask) {
          return snapshot;
        }

        targetTask.metadata = {
          ...(targetTask.metadata ?? {}),
          trackingStatus: "approval_pending",
          githubIssueApprovalId: approvalBundle.approval.id,
        };

        snapshot.timeline.unshift({
          id: `timeline-task-approval-${targetTask.id}-${approvalBundle.approval.id}`,
          type: "task_tracking",
          title: targetTask.title,
          description: `Workflow queued GitHub issue approval ${approvalBundle.approval.id} for this task.`,
          source: "workflow",
          timestamp: new Date().toISOString(),
          metadata: {
            taskId: targetTask.id,
            approvalId: approvalBundle.approval.id,
            trackingStatus: "approval_pending",
          },
          relatedRecordIds: [targetTask.id],
        });

        return snapshot;
      });

      if (snapshotWithTracking) {
        finalSnapshot = snapshotWithTracking;
        task = snapshotWithTracking.tasks.find((item) => item.id === id) ?? task;
      }
    }
  }

  await syncWorkflowFollowUpRecords(finalSnapshot);
  return task;
}

export async function refreshWorkspaceSnapshot(): Promise<WorkspaceSnapshot> {
  clearWorkspaceSnapshotCache();
  const snapshot = await buildWorkspaceSnapshot();
  const persisted = await saveWorkspaceSnapshot(snapshot);
  await syncWorkflowFollowUpRecords(persisted);
  return persisted;
}

export async function createSourceDocument(
  input: CreateSourceDocumentInput
): Promise<CreateSourceDocumentResult> {
  const snapshot = await getWorkspaceSnapshot();
  const now = new Date().toISOString();
  const transcript = input.transcript
    ?.map((entry) => ({
      ...entry,
      speaker: entry.speaker.trim(),
      text: entry.text.trim(),
    }))
    .filter((entry) => entry.speaker && entry.text);
  const content =
    input.content?.trim() ||
    transcript?.map((entry) => `${entry.speaker}: ${entry.text}`).join("\n") ||
    "";
  const document: SourceDocument = {
    id: `source-document-${Date.now()}`,
    workspaceId: WORKSPACE_ID,
    sourceSystem: input.sourceSystem ?? "manual",
    documentType: input.documentType ?? (transcript?.length ? "transcript" : "notes"),
    title: input.title,
    createdAt: now,
    content,
    participants: input.participants ?? [],
    transcript: transcript?.length ? transcript : undefined,
    metadata: {
      persistedBy: "api",
      ...(input.metadata ?? {}),
    },
  };

  const persistedSnapshot = await saveWorkspaceSnapshot({
    ...snapshot,
    sourceDocuments: [document, ...snapshot.sourceDocuments],
    state: {
      ...snapshot.state,
      refreshedAt: now,
    },
  });

  const nextSnapshot = await refreshWorkspaceSnapshot();
  const artifact =
    nextSnapshot.meetingArtifacts.find(
      (candidate) => candidate.sourceDocumentId === document.id
    ) ?? null;

  return {
    snapshot: nextSnapshot,
    document:
      nextSnapshot.sourceDocuments.find((candidate) => candidate.id === document.id) ??
      persistedSnapshot.sourceDocuments[0],
    artifact,
    decisions: nextSnapshot.decisionRecords.filter(
      (candidate) => candidate.sourceDocumentId === document.id
    ),
    tasks: artifact
      ? nextSnapshot.tasks.filter((task) => task.source === artifact.title)
      : [],
  };
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

    if (approval.status !== "pending") {
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

    const trackedTaskId =
      approval.actionKind === "github.issue.create" &&
      approval.metadata &&
      typeof approval.metadata.taskId === "string"
        ? approval.metadata.taskId
        : null;
    if (trackedTaskId) {
      const task = snapshot.tasks.find((item) => item.id === trackedTaskId);
      if (task) {
        task.metadata = {
          ...(task.metadata ?? {}),
          githubIssueApprovalId: approval.id,
          trackingStatus:
            status === "approved" ? "approval_pending" : "approval_rejected",
          lastTrackingMessage:
            status === "approved"
              ? "GitHub issue approval granted. Authrix is executing the mediated write."
              : "GitHub issue approval was rejected before execution.",
        };
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

  await syncWorkflowFollowUpRecords(updatedSnapshot);
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

    const trackedTaskId =
      approval.actionKind === "github.issue.create" &&
      approval.metadata &&
      typeof approval.metadata.taskId === "string"
        ? approval.metadata.taskId
        : null;
    if (trackedTaskId) {
      const task = snapshot.tasks.find((item) => item.id === trackedTaskId);
      if (task) {
        task.metadata = {
          ...(task.metadata ?? {}),
          githubIssueApprovalId: approval.id,
          trackingStatus: input.success ? "tracked" : "execution_failed",
          githubIssueUrl:
            typeof input.metadata?.issueUrl === "string" ? input.metadata.issueUrl : undefined,
          githubIssueNumber:
            typeof input.metadata?.issueNumber === "number"
              ? input.metadata.issueNumber
              : undefined,
          lastTrackingMessage: input.message,
        };
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

  await syncWorkflowFollowUpRecords(updatedSnapshot);
  return updatedSnapshot.approvalRequests.find((item) => item.id === id) ?? null;
}

export async function createLiveApprovalRequest(input: {
  actionKind: string;
  title: string;
  description: string;
  sourceAgent: string;
  affectedSystem: string;
  riskLevel: ApprovalRequest["riskLevel"];
  proposedActionStatus?: ProposedAction["status"];
  relatedRecordIds?: string[];
  metadata?: Record<string, unknown>;
}): Promise<{
  action: ProposedAction;
  approval: ApprovalRequest;
} | null> {
  const createdAt = new Date().toISOString();
  const actionId = `proposed-action-live-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const approvalId = `approval-live-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const proposedStatus = input.proposedActionStatus ?? "proposed";

  const updatedSnapshot = await updatePersistedWorkspaceSnapshot((snapshot) => {
    const action: ProposedAction = {
      id: actionId,
      workspaceId: WORKSPACE_ID,
      actionKind: input.actionKind,
      title: input.title,
      description: input.description,
      targetSystem: input.affectedSystem,
      riskLevel: input.riskLevel,
      sourceAgentId: input.sourceAgent,
      status: proposedStatus,
      createdAt,
      approvalRequestId: approvalId,
      relatedRecordIds: [...(input.relatedRecordIds ?? [])],
      metadata: {
        live: true,
        ...(input.metadata ?? {}),
      },
    };
    const approval: ApprovalRequest = {
      id: approvalId,
      actionKind: input.actionKind,
      title: input.title,
      description: input.description,
      sourceAgent: input.sourceAgent,
      affectedSystem: input.affectedSystem,
      riskLevel: input.riskLevel,
      status: proposedStatus === "approved" ? "approved" : "pending",
      requestedAt: createdAt,
      proposedActionId: actionId,
      relatedRecordIds: [...(input.relatedRecordIds ?? [])],
      metadata: {
        live: true,
        ...(input.metadata ?? {}),
      },
    };

    snapshot.proposedActions.unshift(action);
    snapshot.approvalRequests.unshift(approval);
    snapshot.auditEvents.unshift({
      id: `audit-live-approval-${approval.id}`,
      workspaceId: WORKSPACE_ID,
      action: "approval.requested",
      actor: input.sourceAgent,
      target: input.affectedSystem,
      details: `${input.title} was proposed for approval.`,
      timestamp: createdAt,
      metadata: {
        approvalId: approval.id,
        actionKind: approval.actionKind,
        live: true,
      },
      relatedRecordIds: approval.relatedRecordIds,
    });
    snapshot.timeline.unshift({
      id: `timeline-live-approval-${approval.id}`,
      type: "approval",
      title: approval.title,
      description: `Approval requested for ${approval.actionKind}.`,
      source: approval.sourceAgent,
      timestamp: createdAt,
      metadata: {
        status: approval.status,
        riskLevel: approval.riskLevel,
        live: true,
      },
      relatedRecordIds: approval.relatedRecordIds,
    });
    snapshot.state = {
      ...snapshot.state,
      refreshedAt: createdAt,
    };

    return snapshot;
  });

  if (!updatedSnapshot) {
    return null;
  }

  const action = updatedSnapshot.proposedActions.find((item) => item.id === actionId);
  const approval = updatedSnapshot.approvalRequests.find((item) => item.id === approvalId);
  return action && approval ? { action, approval } : null;
}

function shouldQueueWorkflowIssueApproval(task: SuggestedTask): boolean {
  if (task.sourceAgentId !== "workflow" || task.status !== "approved") {
    return false;
  }

  const trackingStatus =
    typeof task.metadata?.trackingStatus === "string"
      ? task.metadata.trackingStatus
      : null;
  const githubIssueNumber = task.metadata?.githubIssueNumber;

  return trackingStatus !== "approval_pending" &&
    trackingStatus !== "tracked" &&
    typeof githubIssueNumber !== "number";
}

function buildWorkflowIssueTitle(task: SuggestedTask): string {
  return `Workflow follow-up: ${task.title}`;
}

function buildWorkflowIssueDescription(task: SuggestedTask): string {
  const owner = task.suggestedOwner?.trim() || "Unassigned";
  const dueDate = task.dueDate ? new Date(task.dueDate).toISOString() : "Not set";

  return [
    task.description,
    "",
    "---",
    "Created by Authrix Workflow after task approval.",
    `Task id: ${task.id}`,
    `Priority: ${task.priority}`,
    `Owner: ${owner}`,
    `Due date: ${dueDate}`,
    `Source: ${task.source}`,
    `Source agent: ${task.sourceAgentId}`,
  ].join("\n");
}

function mapTaskPriorityToRisk(
  priority: SuggestedTask["priority"]
): ApprovalRequest["riskLevel"] {
  if (priority === "critical" || priority === "high") {
    return "high";
  }

  if (priority === "medium") {
    return "medium";
  }

  return "low";
}

function getDefaultGitHubRepository(): string | undefined {
  const owner = process.env.GITHUB_OWNER?.trim();
  const repo = process.env.GITHUB_REPO?.trim();

  return owner && repo ? `${owner}/${repo}` : undefined;
}

async function buildWorkspaceSnapshot(): Promise<WorkspaceSnapshot> {
  const refreshedAt = new Date().toISOString();
  const existingSnapshot = await loadPersistedWorkspaceSnapshot();
  const githubIngestion = await getGitHubIngestionResult();
  const slackState = await loadSlackWorkspaceState().catch(() => null);
  const runtimeSessions = await compactRecentRuntimeSessions(8);
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
  const docsRuns = await Promise.all(
    sourceDocuments.map((document) =>
      executeDocsAgent(document, engineerRun.output.summary)
    )
  );

  const meetingArtifacts = docsRuns.map((run) => run.output.artifact);
  const workflowMeetingArtifacts = selectWorkflowMeetingArtifacts(
    meetingArtifacts,
    sourceDocuments
  );
  let decisionRecords = docsRuns.flatMap((run) => run.output.decisions);

  const taskRun = await executeTaskAgent(engineerRun.output.summary);
  const workflowRun = await executeWorkflowAgent(
    engineerRun.output.summary,
    workflowMeetingArtifacts,
    [
      ...(existingSnapshot?.tasks ?? []),
      ...taskRun.output.tasks,
    ]
  );

  const tasks = sortTasks(
    mergePersistedTasks(
      [...taskRun.output.tasks, ...workflowRun.output.tasks],
      existingSnapshot?.tasks ?? []
    )
  );
  decisionRecords = linkDecisionsToTasks(decisionRecords, workflowMeetingArtifacts, tasks);

  const persistedCostReport = existingSnapshot?.costReport;
  const devopsRun = await executeDevopsAgent(persistedCostReport);
  const baseRiskAlerts = sortRiskAlerts([
    ...buildEngineeringRiskAlerts(engineerRun.output.summary),
    ...workflowRun.output.alerts,
    ...buildOperationsRiskAlerts(devopsRun.output.report),
  ]);
  const operationalDriftAlerts = buildOperationalDriftAlerts({
    workspaceId: WORKSPACE_ID,
    generatedAt: refreshedAt,
    engineeringActivities,
    sourceDocuments,
    meetingArtifacts,
    decisionRecords,
    costReport: devopsRun.output.report,
    tasks,
  });

  const proposedActions = mergePersistedProposedActions(
    buildProposedActions(
      tasks,
      decisionRecords,
      [...baseRiskAlerts, ...operationalDriftAlerts],
      meetingArtifacts
    ),
    existingSnapshot?.proposedActions ?? []
  );
  const approvalRequests = mergePersistedApprovalRequests(
    buildApprovalRequests(proposedActions),
    existingSnapshot?.approvalRequests ?? []
  );
  const approvalDriftAlerts = buildApprovalDriftAlerts({
    workspaceId: WORKSPACE_ID,
    generatedAt: refreshedAt,
    approvalRequests,
  });
  const riskAlerts = sortRiskAlerts([
    ...baseRiskAlerts,
    ...operationalDriftAlerts,
    ...approvalDriftAlerts,
  ]);
  const memories = buildWorkspaceMemoryRecords({
    engineeringSummary: engineerRun.output.summary,
    decisionRecords,
    tasks,
    costReport: devopsRun.output.report,
    runtimeSessions,
    slackState,
  });
  const handoffs = buildAgentHandoffRecords({
    sourceDocuments,
    meetingArtifacts,
    tasks,
    approvals: approvalRequests,
    slackState,
  });

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
    docsRuns,
    taskPipeline: taskRun.pipelineStatus,
    workflowPipeline: workflowRun.pipelineStatus,
    devopsProvider: devopsRun.provider,
    hasPersistedDocuments: Boolean(existingSnapshot?.sourceDocuments.length),
    financeSourceMode:
      devopsRun.output.report.metadata?.sourceMode === "live" ||
      devopsRun.output.report.metadata?.sourceMode === "mixed"
        ? devopsRun.output.report.metadata.sourceMode
        : "mock",
    driftAlertCount: operationalDriftAlerts.length + approvalDriftAlerts.length,
    memoryCount: memories.length,
    resumableSessionCount: countResumableRuntimeSessions(runtimeSessions),
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
    sourceDocuments,
    meetingArtifacts,
    decisionRecords,
    costReport: devopsRun.output.report,
    riskAlerts,
    approvalRequests,
    auditEvents,
    handoffs,
  });

  return {
    workspace,
    state: {
      storage: "filesystem",
      refreshedAt,
      persistedAt: refreshedAt,
      memoryRefreshedAt: refreshedAt,
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
    memories,
    handoffs,
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
    (integration) =>
      integration.service !== "GitHub" &&
      integration.service !== "Auth0" &&
      integration.service !== "Notion" &&
      integration.service !== "Slack"
  );

  return [
    getAuth0IntegrationStatus(),
    githubIntegration,
    getNotionIntegrationStatus(),
    getSlackIntegrationStatus(),
    ...baseIntegrations,
  ];
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

function selectWorkflowMeetingArtifacts(
  meetingArtifacts: MeetingArtifact[],
  sourceDocuments: SourceDocument[]
): MeetingArtifact[] {
  const documentsById = new Map(sourceDocuments.map((document) => [document.id, document]));

  return meetingArtifacts.filter((artifact) =>
    shouldHandoffSourceDocumentToWorkflow(documentsById.get(artifact.sourceDocumentId))
  );
}

function shouldHandoffSourceDocumentToWorkflow(
  document: SourceDocument | undefined
): boolean {
  if (!document) {
    return true;
  }

  const flag = document.metadata.workflowHandoffRequested;
  if (typeof flag === "boolean") {
    return flag;
  }

  if (typeof flag === "string") {
    return flag !== "false";
  }

  return true;
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

async function executeDocsAgent(
  sourceDocument: SourceDocument,
  engineeringSummary: EngineeringSummary
): Promise<DocsPipelineExecution> {
  return runDocsPipeline({ sourceDocument, engineeringSummary });
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

async function executeDevopsAgent(
  existingReport?: CostReport
): Promise<LocalExecution<{ report: CostReport }>> {
  const modelProvider = getModelProvider();
  const model = getDefaultModelForAgent("devops");
  const financeIngestion = await loadFinanceIngestion(existingReport);
  const baseInput = {
    costBreakdown: financeIngestion.breakdown,
    anomalies: financeIngestion.anomalies,
    period: financeIngestion.period,
    totalSpend: financeIngestion.totalSpend,
    currency: financeIngestion.currency,
  };
  const reportMetadata = {
    sourceMode: financeIngestion.sourceMode,
    sources: financeIngestion.sources,
    ingestionMessage: financeIngestion.ingestionMessage,
  } satisfies Record<string, unknown>;

  if (modelProvider.configured) {
    try {
      const start = Date.now();
      const output = await runModelDevopsAgent(baseInput, model);
      output.report.metadata = reportMetadata;

      return {
        agentId: "devops",
        output,
        executionTimeMs: Date.now() - start,
        timestamp: output.report.generatedAt,
        provider: "model",
        fallbackReason:
          financeIngestion.sourceMode === "live"
            ? "Hosted model summarized the live finance ingestion dataset."
            : financeIngestion.sourceMode === "mixed"
              ? "Hosted model summarized a mixed finance dataset with both live and fallback signals."
              : "Hosted model summarized the bundled fallback finance dataset until a billing export is connected.",
      };
    } catch {
      // Honest fallback to the typed local path below.
    }
  }

  if (
    existingReport &&
    existingReport.breakdown.length > 0 &&
    financeIngestion.sourceMode !== "live"
  ) {
    return {
      agentId: "devops",
      output: { report: cloneCostReport(existingReport) },
      executionTimeMs: 12,
      timestamp: existingReport.generatedAt,
      provider: "local",
      fallbackReason:
        "Using the persisted finance report until a live billing export is connected.",
    };
  }

  const output = devopsAgent(baseInput);
  output.report.metadata = reportMetadata;

  return {
    agentId: "devops",
    output,
    executionTimeMs: 39,
    timestamp: new Date().toISOString(),
    provider: "local",
    fallbackReason: financeIngestion.ingestionMessage,
  };
}

function buildPipelineStatuses(input: {
  refreshedAt: string;
  githubIntegration: IntegrationStatus;
  engineerPipeline: WorkspacePipelineStatus;
  docsRuns: DocsPipelineExecution[];
  taskPipeline: WorkspacePipelineStatus;
  workflowPipeline: WorkspacePipelineStatus;
  devopsProvider: "local" | "model";
  hasPersistedDocuments: boolean;
  financeSourceMode: "live" | "mixed" | "mock";
  driftAlertCount: number;
  memoryCount: number;
  resumableSessionCount: number;
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
    buildDocsProcessingPipelineStatus(
      input.docsRuns,
      input.hasPersistedDocuments,
      input.refreshedAt
    ),
    input.taskPipeline,
    input.workflowPipeline,
    {
      id: "operational-drift",
      label: "Operational drift",
      provider: "local",
      health: "ready",
      message:
        input.driftAlertCount > 0
          ? `Detected ${input.driftAlertCount} drift signal(s) across docs, ownership, approvals, or recurring topics.`
          : "No active operational drift signals were detected during the latest refresh.",
      updatedAt: input.refreshedAt,
    },
    {
      id: "shared-memory",
      label: "Shared memory",
      provider: "local",
      health: "ready",
      message:
        input.resumableSessionCount > 0
          ? `Authrix compacted ${input.memoryCount} shared memory record(s) and can resume ${input.resumableSessionCount} session(s) without losing context.`
          : `Authrix compacted ${input.memoryCount} shared memory record(s) for cross-specialist continuity.`,
      updatedAt: input.refreshedAt,
    },
    {
      id: "devops-signals",
      label: "Finance/Ops signals",
      provider: input.financeSourceMode === "mock" ? "mock" : input.devopsProvider,
      health: input.financeSourceMode === "mock" ? "fallback" : "ready",
      message: input.financeSourceMode !== "mock"
        ? input.devopsProvider === "model"
          ? "Finance/Ops signals are using the live model layer over the latest spend report."
          : "Finance/Ops signals are using the local typed pipeline over the latest spend report."
        : "Finance/Ops signals are still using the bundled fallback dataset until a finance report is persisted.",
      updatedAt: input.refreshedAt,
    },
  ];
}

function buildDocsProcessingPipelineStatus(
  runs: DocsPipelineExecution[],
  hasPersistedDocuments: boolean,
  refreshedAt: string
): WorkspacePipelineStatus {
  const latestTimestamp =
    runs
      .map((run) => run.timestamp)
      .sort((left, right) => new Date(right).getTime() - new Date(left).getTime())[0] ??
    refreshedAt;
  const allRuntime = runs.length > 0 && runs.every((run) => run.provider === "runtime");
  const allModel = runs.length > 0 && runs.every((run) => run.provider === "model");
  const hadFallback = runs.some((run) => Boolean(run.fallbackReason));

  if (!hasPersistedDocuments) {
    return {
      id: "docs-processing",
      label: "Docs processing",
      provider: allRuntime ? "runtime" : allModel ? "model" : "local",
      health: "fallback",
      message: allRuntime
        ? "Docs processing ran through the runtime, but it is still using bundled fallback meeting documents until real records are persisted."
        : allModel
          ? "Docs processing ran through the hosted model layer, but it is still using bundled fallback meeting documents until real records are persisted."
        : "Docs processing is using bundled fallback meeting documents until real records are persisted.",
      updatedAt: latestTimestamp,
    };
  }

  if (hadFallback) {
    return {
      id: "docs-processing",
      label: "Docs processing",
      provider: "local",
      health: "fallback",
      message: `Docs processing fell back to the local typed pipeline for at least one source document. ${runs.find((run) => run.fallbackReason)?.fallbackReason ?? ""}`.trim(),
      updatedAt: latestTimestamp,
    };
  }

  if (allRuntime) {
    return {
      id: "docs-processing",
      label: "Docs processing",
      provider: "runtime",
      health: "ready",
      message: "Docs processing ran through the live runtime using persisted source documents.",
      updatedAt: latestTimestamp,
    };
  }

  if (allModel) {
    return {
      id: "docs-processing",
      label: "Docs processing",
      provider: "model",
      health: "ready",
      message: "Docs processing ran through the hosted model layer using persisted source documents.",
      updatedAt: latestTimestamp,
    };
  }

  return {
    id: "docs-processing",
    label: "Docs processing",
    provider: "local",
    health: "ready",
    message: "Docs processing is using persisted source documents through the local typed pipeline.",
    updatedAt: latestTimestamp,
  };
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
  const documentationDriftAlert = riskAlerts.find(
    (alert) => alert.id === "risk-drift-documentation-coverage"
  );
  const decisionDriftAlert = riskAlerts.find(
    (alert) => alert.id === "risk-drift-decision-follow-through"
  );
  const recurringQuestionAlert = riskAlerts.find(
    (alert) => alert.id === "risk-drift-recurring-questions"
  );
  const executionBacklogAlert = riskAlerts.find(
    (alert) => alert.id === "risk-drift-execution-backlog"
  );
  const operationsMismatchAlert = riskAlerts.find(
    (alert) => alert.id === "risk-drift-ops-mismatch"
  );

  const actions: ProposedAction[] = [];

  if (operationsAlert) {
    actions.push({
      id: "proposed-action-001",
      workspaceId: WORKSPACE_ID,
      actionKind: "github.issue.create",
      title: "Create follow-up issue for cost anomaly",
      description:
        "The Finance/Ops agent detected a rising spend pattern and wants to create a tracking issue for follow-up.",
      targetSystem: "GitHub",
      riskLevel: "medium",
      sourceAgentId: "devops",
      status: "proposed",
      createdAt: operationsAlert.createdAt,
      relatedRecordIds: [operationsAlert.id],
      metadata: {
        live: false,
      },
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
      metadata: {
        live: false,
      },
    });
  }

  if (documentationDecision) {
    actions.push({
      id: "proposed-action-003",
      workspaceId: WORKSPACE_ID,
      actionKind: "docs.update",
      title: `Update docs after decision: ${documentationDecision.title}`,
      description:
        "Docs should be refreshed so the latest accepted meeting decision is reflected in Authrix's operational records.",
      targetSystem: "Documentation",
      riskLevel: "low",
      sourceAgentId: "docs",
      status: "proposed",
      createdAt: meetingArtifact?.generatedAt ?? documentationDecision.createdAt,
      relatedRecordIds: [
        documentationDecision.id,
        ...(meetingArtifact ? [meetingArtifact.id] : []),
      ],
      metadata: {
        live: false,
      },
    });
  }

  if (documentationDriftAlert) {
    actions.push({
      id: "proposed-action-004",
      workspaceId: WORKSPACE_ID,
      actionKind: "docs.update",
      title: "Refresh docs after engineering drift",
      description:
        "Authrix detected that engineering activity is moving faster than persisted documentation, so it is proposing a controlled docs refresh.",
      targetSystem: "Documentation",
      riskLevel: documentationDriftAlert.severity === "medium" ? "medium" : "low",
      sourceAgentId: "docs",
      status: "proposed",
      createdAt: documentationDriftAlert.createdAt,
      relatedRecordIds: documentationDriftAlert.relatedRecordIds,
      metadata: {
        live: false,
      },
    });
  }

  if (decisionDriftAlert) {
    actions.push({
      id: "proposed-action-005",
      workspaceId: WORKSPACE_ID,
      actionKind: "github.issue.create",
      title: "Create follow-up issue for accepted decisions",
      description:
        "Authrix found accepted decisions without linked execution tasks and wants to create a tracking issue so ownership does not drift.",
      targetSystem: "GitHub",
      riskLevel: decisionDriftAlert.severity,
      sourceAgentId: "workflow",
      status: "proposed",
      createdAt: decisionDriftAlert.createdAt,
      relatedRecordIds: decisionDriftAlert.relatedRecordIds,
      metadata: {
        live: false,
      },
    });
  }

  if (recurringQuestionAlert) {
    actions.push({
      id: "proposed-action-006",
      workspaceId: WORKSPACE_ID,
      actionKind: "github.issue.create",
      title: "Escalate recurring open questions",
      description:
        "Recurring open questions were detected across meetings. Authrix is proposing a tracked issue so the team can resolve them deliberately.",
      targetSystem: "GitHub",
      riskLevel: recurringQuestionAlert.severity,
      sourceAgentId: "docs",
      status: "proposed",
      createdAt: recurringQuestionAlert.createdAt,
      relatedRecordIds: recurringQuestionAlert.relatedRecordIds,
      metadata: {
        live: false,
      },
    });
  }

  if (executionBacklogAlert) {
    actions.push({
      id: "proposed-action-007",
      workspaceId: WORKSPACE_ID,
      actionKind: "github.issue.create",
      title: "Create issue to triage execution backlog",
      description:
        "Authrix detected a growing execution backlog and wants to create a tracked issue so the team can rebalance owners and follow-through.",
      targetSystem: "GitHub",
      riskLevel: executionBacklogAlert.severity,
      sourceAgentId: "workflow",
      status: "proposed",
      createdAt: executionBacklogAlert.createdAt,
      relatedRecordIds: executionBacklogAlert.relatedRecordIds,
      metadata: {
        live: false,
      },
    });
  }

  if (operationsMismatchAlert) {
    actions.push({
      id: "proposed-action-008",
      workspaceId: WORKSPACE_ID,
      actionKind: "github.issue.create",
      title: "Review unexplained cost drift",
      description:
        "Operational cost drift was detected without matching high-impact product activity, so Authrix is proposing a tracked investigation issue.",
      targetSystem: "GitHub",
      riskLevel: operationsMismatchAlert.severity,
      sourceAgentId: "devops",
      status: "proposed",
      createdAt: operationsMismatchAlert.createdAt,
      relatedRecordIds: operationsMismatchAlert.relatedRecordIds,
      metadata: {
        live: false,
      },
    });
  }

  return dedupeProposedActions(actions);
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
        metadata: action.metadata ? { ...action.metadata } : undefined,
      };
    })
    .sort(sortByDateDesc("requestedAt"));
}

function mergePersistedProposedActions(
  nextActions: ProposedAction[],
  persistedActions: ProposedAction[]
): ProposedAction[] {
  const persistedById = new Map(persistedActions.map((action) => [action.id, action]));
  const merged = nextActions.map((action) => {
    const persisted = persistedById.get(action.id);
    if (!persisted) {
      return action;
    }

    return {
      ...action,
      status: persisted.status,
      approvalRequestId: persisted.approvalRequestId ?? action.approvalRequestId,
      metadata: {
        ...(action.metadata ?? {}),
        ...(persisted.metadata ?? {}),
      },
    };
  });
  const mergedIds = new Set(merged.map((action) => action.id));
  const carried = persistedActions.filter((action) => !mergedIds.has(action.id));

  return dedupeProposedActions([...merged, ...carried]);
}

function mergePersistedApprovalRequests(
  nextApprovals: ApprovalRequest[],
  persistedApprovals: ApprovalRequest[]
): ApprovalRequest[] {
  const persistedById = new Map(persistedApprovals.map((approval) => [approval.id, approval]));
  const merged = nextApprovals.map((approval) => {
    const persisted = persistedById.get(approval.id);
    if (!persisted) {
      return approval;
    }

    return {
      ...approval,
      status: persisted.status,
      resolvedAt: persisted.resolvedAt,
      resolvedBy: persisted.resolvedBy,
      executionResult: persisted.executionResult,
      metadata: {
        ...(approval.metadata ?? {}),
        ...(persisted.metadata ?? {}),
      },
    };
  });
  const mergedIds = new Set(merged.map((approval) => approval.id));
  const carried = persistedApprovals.filter((approval) => !mergedIds.has(approval.id));

  return [...merged, ...carried].sort(sortByDateDesc("requestedAt"));
}

function dedupeProposedActions(actions: ProposedAction[]): ProposedAction[] {
  const seen = new Set<string>();
  const deduped: ProposedAction[] = [];

  for (const action of actions) {
    const key = `${action.actionKind}:${action.title.toLowerCase()}`;
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    deduped.push(action);
  }

  return deduped;
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
  docsRuns: DocsPipelineExecution[],
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
      agentId: "docs",
      status: "completed" as const,
      startedAt: run.timestamp,
      completedAt: run.timestamp,
      inputSummary: `Processed meeting document ${run.output.artifact.sourceDocumentId}.`,
      outputSummary: `Created ${run.output.decisions.length} decisions and ${run.output.artifact.actionItems.length} action items.`,
      provider: run.provider,
      runtimeSessionId: run.sessionId,
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
  sourceDocuments: SourceDocument[];
  meetingArtifacts: MeetingArtifact[];
  decisionRecords: DecisionRecord[];
  costReport: CostReport;
  riskAlerts: RiskAlert[];
  approvalRequests: ApprovalRequest[];
  auditEvents: AuditEvent[];
  handoffs: AgentHandoffRecord[];
}): TimelineEntry[] {
  const entries: TimelineEntry[] = [
    ...input.sourceDocuments.map((document) => ({
      id: `timeline-${document.id}`,
      type: "source_document",
      title: document.title,
      description: `A ${document.documentType} from ${document.sourceSystem} was added to the workspace.`,
      source: document.sourceSystem,
      timestamp: document.createdAt,
      metadata: {
        documentType: document.documentType,
        participants: document.participants.join(", "),
      },
      relatedRecordIds: [document.id],
    })),
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
    {
      id: `timeline-${input.costReport.id}`,
      type: "cost_report",
      title: "Cost report refreshed",
      description: input.costReport.summary,
      source: "devops",
      timestamp: input.costReport.generatedAt,
      metadata: {
        riskLevel: input.costReport.riskLevel,
        totalSpend: input.costReport.totalSpend,
        currency: input.costReport.currency,
      },
      relatedRecordIds: [input.costReport.id],
    },
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
    ...input.handoffs.map((handoff) => ({
      id: `timeline-${handoff.id}`,
      type: "agent_handoff",
      title: `${handoff.fromAgentId} -> ${handoff.toAgentId}`,
      description: handoff.reason,
      source: handoff.source,
      timestamp: handoff.completedAt ?? handoff.createdAt,
      metadata: {
        status: handoff.status,
      },
      relatedRecordIds: handoff.relatedRecordIds,
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
    metadata: report.metadata ? { ...report.metadata } : undefined,
  };
}

function mergePersistedTasks(
  nextTasks: SuggestedTask[],
  existingTasks: SuggestedTask[]
): SuggestedTask[] {
  const existingById = new Map(existingTasks.map((task) => [task.id, task]));
  const mergedTasks = nextTasks.map((task) => {
    const existing = existingById.get(task.id);
    if (!existing) {
      return task;
    }

    return {
      ...task,
      createdAt: existing.createdAt,
      status: existing.status,
      suggestedOwner: existing.suggestedOwner ?? task.suggestedOwner,
      dueDate: existing.dueDate ?? task.dueDate,
      metadata: {
        ...(task.metadata ?? {}),
        ...(existing.metadata ?? {}),
      },
    };
  });

  const mergedIds = new Set(mergedTasks.map((task) => task.id));
  const carriedTasks = existingTasks.filter(
    (task) => !mergedIds.has(task.id) && task.status !== "rejected"
  );

  return [...mergedTasks, ...carriedTasks];
}

function sortTasks(tasks: SuggestedTask[]): SuggestedTask[] {
  const priorityOrder: Record<SuggestedTask["priority"], number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };

  const statusOrder: Record<SuggestedTask["status"], number> = {
    suggested: 0,
    approved: 1,
    completed: 2,
    rejected: 3,
  };

  return [...tasks].sort((left, right) => {
    const statusDelta = statusOrder[left.status] - statusOrder[right.status];
    if (statusDelta !== 0) {
      return statusDelta;
    }

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
