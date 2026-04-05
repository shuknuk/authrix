import {
  getRuntimeSessionRecord,
  getRuntimeTranscript,
  listRuntimeRuns,
  listRuntimeSessions,
  touchRuntimeSession,
} from "@/lib/runtime/store";
import type {
  AgentHandoffRecord,
  ApprovalRequest,
  CostReport,
  DecisionRecord,
  EngineeringSummary,
  MeetingArtifact,
  SourceDocument,
  SuggestedTask,
  WorkspaceMemoryRecord,
} from "@/types/domain";
import type { SlackWorkspaceState } from "@/types/messaging";
import type { RuntimeSessionRecord, RuntimeTranscriptEvent } from "@/types/runtime";

export async function compactRuntimeSessionMemory(
  sessionId: string
): Promise<RuntimeSessionRecord | null> {
  const session = await getRuntimeSessionRecord(sessionId);
  if (!session) {
    return null;
  }

  const transcript = await getRuntimeTranscript(sessionId, 60);
  const summary = buildSessionMemorySummary(session, transcript);
  const compactedAt = new Date().toISOString();

  return touchRuntimeSession(sessionId, {
    metadata: {
      memorySummary: summary.summary,
      lastIntent: summary.lastIntent,
      lastOutcome: summary.lastOutcome,
      resumeHint: summary.resumeHint,
      resumable: summary.resumable,
      memoryCompactedAt: compactedAt,
    },
  });
}

export async function compactRecentRuntimeSessions(limit = 8): Promise<RuntimeSessionRecord[]> {
  const sessions = await listRuntimeSessions(limit);
  const compacted = await Promise.all(
    sessions.map(async (session) => {
      const compactedAt = readString(session.metadata.memoryCompactedAt);
      const needsRefresh =
        !compactedAt ||
        new Date(compactedAt).getTime() < new Date(session.lastActiveAt).getTime();

      return needsRefresh ? compactRuntimeSessionMemory(session.id) : session;
    })
  );

  return compacted.filter((session): session is RuntimeSessionRecord => Boolean(session));
}

export function buildWorkspaceMemoryRecords(input: {
  engineeringSummary: EngineeringSummary;
  decisionRecords: DecisionRecord[];
  tasks: SuggestedTask[];
  costReport: CostReport;
  runtimeSessions: RuntimeSessionRecord[];
  slackState: SlackWorkspaceState | null;
}): WorkspaceMemoryRecord[] {
  const records: WorkspaceMemoryRecord[] = [];

  records.push({
    id: `workspace-memory-engineering-${input.engineeringSummary.id}`,
    title: "Engineering context",
    summary:
      input.engineeringSummary.overallSummary ||
      "Authrix has a persisted engineering summary ready for downstream specialists.",
    category: "context",
    sourceAgentId: "engineer",
    createdAt: input.engineeringSummary.generatedAt,
    updatedAt: input.engineeringSummary.generatedAt,
    confidence: "high",
    relatedRecordIds: [input.engineeringSummary.id],
    metadata: {
      highlightCount: input.engineeringSummary.highlights.length,
      riskFlagCount: input.engineeringSummary.riskFlags.length,
    },
  });

  const latestDecision = input.decisionRecords
    .filter((decision) => decision.status !== "superseded")
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())[0];
  if (latestDecision) {
    records.push({
      id: `workspace-memory-decision-${latestDecision.id}`,
      title: latestDecision.title,
      summary: latestDecision.summary,
      category: "decision",
      sourceAgentId: latestDecision.sourceAgentId,
      createdAt: latestDecision.createdAt,
      updatedAt: latestDecision.createdAt,
      confidence: latestDecision.status === "accepted" ? "high" : "medium",
      relatedRecordIds: [latestDecision.id, ...latestDecision.relatedTaskIds],
      metadata: {
        status: latestDecision.status,
        participantCount: latestDecision.participants.length,
      },
    });
  }

  const priorityOrder: Record<SuggestedTask["priority"], number> = {
    critical: 0,
    high: 1,
    medium: 2,
    low: 3,
  };
  const nextTask = [...input.tasks]
    .filter((task) => task.status !== "completed" && task.status !== "rejected")
    .sort((left, right) => {
      const priorityDelta = priorityOrder[left.priority] - priorityOrder[right.priority];
      if (priorityDelta !== 0) {
        return priorityDelta;
      }

      return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
    })[0];
  if (nextTask) {
    records.push({
      id: `workspace-memory-task-${nextTask.id}`,
      title: `Next follow-through: ${nextTask.title}`,
      summary: nextTask.description,
      category: "task",
      sourceAgentId: nextTask.sourceAgentId,
      createdAt: nextTask.createdAt,
      updatedAt: nextTask.createdAt,
      confidence: nextTask.priority === "critical" || nextTask.priority === "high" ? "high" : "medium",
      relatedRecordIds: [nextTask.id],
      metadata: {
        priority: nextTask.priority,
        status: nextTask.status,
        suggestedOwner: nextTask.suggestedOwner,
        dueDate: nextTask.dueDate,
      },
    });
  }

  const topSpend = [...input.costReport.breakdown].sort((left, right) => right.amount - left.amount)[0];
  records.push({
    id: `workspace-memory-finance-${input.costReport.id}`,
    title: "Finance posture",
    summary:
      input.costReport.summary ||
      `Tracked spend is $${input.costReport.totalSpend.toFixed(2)} ${input.costReport.currency}.`,
    category: "finance",
    sourceAgentId: "devops",
    createdAt: input.costReport.generatedAt,
    updatedAt: input.costReport.generatedAt,
    confidence: "high",
    relatedRecordIds: [input.costReport.id],
    metadata: {
      totalSpend: input.costReport.totalSpend,
      currency: input.costReport.currency,
      riskLevel: input.costReport.riskLevel,
      topSpendService: topSpend?.service,
    },
  });

  const continuityMemories = input.runtimeSessions
    .filter((session) => readString(session.metadata.memorySummary))
    .slice(0, 3)
    .map((session) => {
      const memorySummary = readString(session.metadata.memorySummary) ?? "Authrix preserved the latest session context.";
      const memoryCompactedAt = readString(session.metadata.memoryCompactedAt) ?? session.lastActiveAt;
      const resumeHint = readString(session.metadata.resumeHint);

      return {
        id: `workspace-memory-session-${session.id}`,
        title: session.label ?? "Runtime continuity",
        summary: resumeHint ? `${memorySummary} ${resumeHint}` : memorySummary,
        category: "continuity" as const,
        sourceAgentId: readAgentId(session),
        createdAt: session.createdAt,
        updatedAt: memoryCompactedAt,
        confidence: "medium" as const,
        relatedRecordIds: [session.id],
        metadata: {
          origin: session.origin,
          runCount: session.runCount,
          resumable: readBoolean(session.metadata.resumable),
        },
      };
    });
  records.push(...continuityMemories);

  const latestBriefing = input.slackState?.briefings[0];
  if (latestBriefing) {
    records.push({
      id: `workspace-memory-briefing-${latestBriefing.id}`,
      title: latestBriefing.title,
      summary: latestBriefing.body,
      category: "continuity",
      sourceAgentId: "workflow",
      createdAt: latestBriefing.createdAt,
      updatedAt: latestBriefing.deliveredAt ?? latestBriefing.createdAt,
      confidence: latestBriefing.deliveryStatus === "failed" ? "low" : "medium",
      relatedRecordIds: latestBriefing.relatedRecordIds,
      metadata: {
        deliveryStatus: latestBriefing.deliveryStatus,
        targetChannelId: latestBriefing.targetChannelId,
      },
    });
  }

  return records
    .sort((left, right) => new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime())
    .slice(0, 8);
}

export function buildAgentHandoffRecords(input: {
  sourceDocuments: SourceDocument[];
  meetingArtifacts: MeetingArtifact[];
  tasks: SuggestedTask[];
  approvals: ApprovalRequest[];
  slackState: SlackWorkspaceState | null;
}): AgentHandoffRecord[] {
  const records: AgentHandoffRecord[] = [];

  for (const delegation of input.slackState?.delegations ?? []) {
    records.push({
      id: `agent-handoff-slack-${delegation.id}`,
      fromAgentId: delegation.parentAgentId,
      toAgentId: delegation.delegatedAgentId,
      source: "slack",
      reason: delegation.reason,
      status: delegation.status === "completed" ? "completed" : "open",
      createdAt: delegation.createdAt,
      completedAt: delegation.completedAt,
      relatedRecordIds: [delegation.id, delegation.conversationId, delegation.sourceMessageId],
      metadata: {
        conversationId: delegation.conversationId,
      },
    });
  }

  const workflowTasksBySource = new Map<string, SuggestedTask[]>();
  for (const task of input.tasks) {
    const existing = workflowTasksBySource.get(task.source) ?? [];
    existing.push(task);
    workflowTasksBySource.set(task.source, existing);
  }

  for (const artifact of input.meetingArtifacts) {
    const sourceDocument = input.sourceDocuments.find(
      (document) => document.id === artifact.sourceDocumentId
    );
    if (!sourceDocument || !shouldTrackWorkflowHandoff(sourceDocument)) {
      continue;
    }

    const linkedTasks = workflowTasksBySource.get(artifact.title) ?? [];
    records.push({
      id: `agent-handoff-docs-workflow-${artifact.id}`,
      fromAgentId: "docs",
      toAgentId: "workflow",
      source: "meeting",
      reason: `Meeting artifact "${artifact.title}" requested workflow follow-through.`,
      status: linkedTasks.length > 0 ? "completed" : "open",
      createdAt: artifact.generatedAt,
      completedAt: linkedTasks.length > 0 ? linkedTasks[0]?.createdAt : undefined,
      relatedRecordIds: [artifact.id, sourceDocument.id, ...linkedTasks.map((task) => task.id)],
      metadata: {
        linkedTaskCount: linkedTasks.length,
      },
    });
  }

  for (const approval of input.approvals) {
    records.push({
      id: `agent-handoff-approval-${approval.id}`,
      fromAgentId: approval.sourceAgent,
      toAgentId: "approval-engine",
      source: "approval",
      reason: `Approval-gated handoff for ${approval.actionKind}.`,
      status: approval.status === "pending" ? "open" : "completed",
      createdAt: approval.requestedAt,
      completedAt: approval.resolvedAt,
      relatedRecordIds: approval.relatedRecordIds ?? [approval.id],
      metadata: {
        actionKind: approval.actionKind,
        approvalStatus: approval.status,
        affectedSystem: approval.affectedSystem,
      },
    });
  }

  return records
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())
    .slice(0, 12);
}

export function countResumableRuntimeSessions(sessions: RuntimeSessionRecord[]): number {
  return sessions.filter((session) => isResumableSession(session)).length;
}

export async function listRecentRuntimeSessionsWithMemory(
  limit = 8
): Promise<RuntimeSessionRecord[]> {
  return compactRecentRuntimeSessions(limit);
}

export async function listRecentRuntimeRunsForMemory(limit = 25) {
  return listRuntimeRuns(limit);
}

function buildSessionMemorySummary(
  session: RuntimeSessionRecord,
  transcript: RuntimeTranscriptEvent[]
): {
  summary: string;
  lastIntent?: string;
  lastOutcome?: string;
  resumeHint: string;
  resumable: boolean;
} {
  const lastUserInput = [...transcript]
    .reverse()
    .find((event) => event.role === "user" && event.type === "agent_input");
  const lastAssistantOutput = [...transcript]
    .reverse()
    .find((event) => event.role === "assistant" && event.type === "agent_output");
  const lastStatus = [...transcript]
    .reverse()
    .find((event) => event.type === "run_status");
  const lastIntent = lastUserInput ? clip(lastUserInput.content, 180) : undefined;
  const lastOutcome = session.lastError
    ? clip(session.lastError, 180)
    : lastAssistantOutput
      ? clip(lastAssistantOutput.content, 180)
      : lastStatus
        ? clip(lastStatus.content, 180)
        : undefined;
  const resumable = isResumableSession(session);
  const summaryParts = [
    lastIntent ? `Last ask: ${lastIntent}` : null,
    lastOutcome ? `Latest outcome: ${lastOutcome}` : null,
  ].filter((part): part is string => Boolean(part));
  const summary =
    summaryParts.join(" ") ||
    "Authrix preserved this session so the next turn can continue without starting over.";
  const agentId = readAgentId(session);
  const resumeHint = session.lastError
    ? `Resume ${agentId} by addressing the last blocker before continuing the same thread.`
    : resumable
      ? `Resume ${agentId} in this same session to continue the work without losing context.`
      : `Reopen this ${agentId} session only if the team needs another pass.`;

  return {
    summary,
    lastIntent,
    lastOutcome,
    resumeHint,
    resumable,
  };
}

function readAgentId(session: RuntimeSessionRecord): string {
  const agentId = session.metadata.agentId;
  return typeof agentId === "string" && agentId.trim().length > 0 ? agentId : "agent";
}

function shouldTrackWorkflowHandoff(document: SourceDocument): boolean {
  const flag = document.metadata.workflowHandoffRequested;
  if (typeof flag === "boolean") {
    return flag;
  }

  if (typeof flag === "string") {
    return flag !== "false";
  }

  return true;
}

function isResumableSession(session: RuntimeSessionRecord): boolean {
  return readBoolean(session.metadata.resumable) || session.state === "active" || Boolean(session.lastError);
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value.trim() : undefined;
}

function readBoolean(value: unknown): boolean {
  return value === true;
}

function clip(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}
