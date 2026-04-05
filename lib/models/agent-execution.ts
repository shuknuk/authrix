import { getModelProvider } from "@/lib/models/provider";
import type {
  DevOpsAgentInput,
  DevOpsAgentOutput,
  DocsAgentInput,
  DocsAgentOutput,
  EngineerAgentInput,
  EngineerAgentOutput,
  WorkflowAgentInput,
  WorkflowAgentOutput,
} from "@/types/agents";
import type {
  ContributorSummary,
  DecisionRecord,
  MeetingActionItem,
  MeetingArtifact,
  RepoSummary,
  RiskAlert,
  RiskFlag,
  SummaryHighlight,
  SuggestedTask,
} from "@/types/domain";

export async function runModelEngineerAgent(
  input: EngineerAgentInput,
  model: string
): Promise<EngineerAgentOutput> {
  const provider = getModelProvider();
  const result = await provider.chat({
    model,
    format: "json",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          'You are the Authrix Engineering agent. Return JSON only with keys overallSummary, highlights, repoBreakdown, contributorBreakdown, and riskFlags. Keep outputs concise and operational. highlights items need title, description, impact, relatedActivityIds. repoBreakdown items need repo, commitCount, prCount, issueCount, summary. contributorBreakdown items need author, commitCount, prCount, topRepos. riskFlags items need title, description, severity, relatedActivityIds.',
      },
      {
        role: "user",
        content: JSON.stringify(input),
      },
    ],
  });

  const parsed = safeParseJson(result.content);
  return {
    summary: {
      id: `summary_${Date.now()}`,
      period: input.period,
      generatedAt: new Date().toISOString(),
      overallSummary:
        readString(parsed, "overallSummary") ??
        `Engineering activity covered ${input.activities.length} event(s) this period.`,
      highlights: readHighlights(parsed),
      repoBreakdown: readRepoBreakdown(parsed),
      contributorBreakdown: readContributorBreakdown(parsed),
      riskFlags: readRiskFlags(parsed),
      activityCount: input.activities.length,
    },
  };
}

export async function runModelDocsAgent(
  input: DocsAgentInput,
  model: string
): Promise<DocsAgentOutput> {
  const provider = getModelProvider();
  const result = await provider.chat({
    model,
    format: "json",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          'You are the Authrix Docs agent. Return JSON only with keys summary, notes, actionItems, decisions, and openQuestions. actionItems items need title, description, owner, dueDate. decisions is an array of decision strings. openQuestions is an array of strings.',
      },
      {
        role: "user",
        content: JSON.stringify(input),
      },
    ],
  });

  const parsed = safeParseJson(result.content);
  const generatedAt = new Date().toISOString();
  const actionItems = readArray(parsed, "actionItems").map((item, index) =>
    toMeetingActionItem(input.sourceDocument.id, generatedAt, item, index)
  );
  const decisions = readStringArray(parsed, "decisions");
  const artifact: MeetingArtifact = {
    id: `artifact-${input.sourceDocument.id}`,
    workspaceId: input.sourceDocument.workspaceId,
    sourceDocumentId: input.sourceDocument.id,
    title: `${input.sourceDocument.title} Notes`,
    generatedAt,
    summary:
      readString(parsed, "summary") ??
      `${input.sourceDocument.title} was processed into a meeting artifact.`,
    notes: readStringArray(parsed, "notes"),
    participants: input.sourceDocument.participants,
    actionItems,
    decisions,
    openQuestions: readStringArray(parsed, "openQuestions"),
  };

  const decisionRecords: DecisionRecord[] = decisions.map((decision, index) => ({
    id: `decision-${input.sourceDocument.id}-${index + 1}`,
    workspaceId: input.sourceDocument.workspaceId,
    title: decision.length > 72 ? `${decision.slice(0, 69)}...` : decision,
    summary: decision,
    participants: input.sourceDocument.participants,
    status: "accepted",
    sourceAgentId: "docs",
    sourceDocumentId: input.sourceDocument.id,
    createdAt: generatedAt,
    relatedTaskIds: [],
  }));

  return {
    artifact,
    decisions: decisionRecords,
  };
}

export async function runModelWorkflowAgent(
  input: WorkflowAgentInput,
  model: string
): Promise<WorkflowAgentOutput> {
  const provider = getModelProvider();
  const result = await provider.chat({
    model,
    format: "json",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          'You are the Authrix Workflow agent. Return JSON only with keys tasks and alerts. tasks items need title, description, priority, suggestedOwner, dueDate. alerts items need title, description, severity, category. Use category workflow unless a better operational fit is obvious.',
      },
      {
        role: "user",
        content: JSON.stringify(input),
      },
    ],
  });

  const parsed = safeParseJson(result.content);
  const createdAt =
    input.meetingArtifacts?.[0]?.generatedAt ??
    input.engineeringSummary?.generatedAt ??
    new Date().toISOString();

  const tasks: SuggestedTask[] = readArray(parsed, "tasks").map((task, index) => ({
    id: `task-workflow-model-${Date.now()}-${index + 1}`,
    title: readString(task, "title") ?? `Workflow follow-up ${index + 1}`,
    description: readString(task, "description") ?? "Generated by the Authrix Workflow agent.",
    priority: readPriority(task),
    suggestedOwner: readString(task, "suggestedOwner"),
    dueDate: readString(task, "dueDate"),
    source: "Workflow Agent",
    sourceAgentId: "workflow",
    status: "suggested",
    createdAt,
    metadata: {
      workflowOrigin: "model_generated",
      ownerStatus: readString(task, "suggestedOwner") ? "assigned" : "missing",
      trackingStatus: "not_requested",
    },
  }));

  const alerts: RiskAlert[] = readArray(parsed, "alerts").map((alert, index) => ({
    id: `risk-workflow-model-${Date.now()}-${index + 1}`,
    workspaceId: "workspace-authrix",
    title: readString(alert, "title") ?? `Workflow alert ${index + 1}`,
    description:
      readString(alert, "description") ??
      "Workflow agent identified a follow-through risk.",
    severity: readSeverity(alert),
    category: readWorkflowCategory(alert),
    sourceAgentId: "workflow",
    createdAt,
    relatedRecordIds: [],
  }));

  return { tasks, alerts };
}

export async function runModelDevopsAgent(
  input: DevOpsAgentInput,
  model: string
): Promise<DevOpsAgentOutput> {
  const provider = getModelProvider();
  const result = await provider.chat({
    model,
    format: "json",
    temperature: 0.2,
    messages: [
      {
        role: "system",
        content:
          'You are the Authrix Finance/Ops agent. Return JSON only with keys summary and riskLevel. riskLevel must be one of low, medium, high.',
      },
      {
        role: "user",
        content: JSON.stringify(input),
      },
    ],
  });

  const parsed = safeParseJson(result.content);

  return {
    report: {
      id: `cost_${Date.now()}`,
      period: input.period,
      generatedAt: new Date().toISOString(),
      totalSpend: input.totalSpend,
      currency: input.currency,
      breakdown: input.costBreakdown,
      anomalies: input.anomalies,
      riskLevel: readSeverity(parsed) as "low" | "medium" | "high",
      summary:
        readString(parsed, "summary") ??
        `Total spend this period: ${input.currency} ${input.totalSpend.toFixed(2)}.`,
    },
  };
}

function safeParseJson(value: string): Record<string, unknown> {
  try {
    return JSON.parse(value) as Record<string, unknown>;
  } catch {
    return {};
  }
}

function readArray(input: Record<string, unknown>, key: string): Record<string, unknown>[] {
  const value = input[key];
  return Array.isArray(value) ? value.filter(isObject) : [];
}

function readHighlights(input: Record<string, unknown>): SummaryHighlight[] {
  return readArray(input, "highlights").map((entry, index) => ({
    title: readString(entry, "title") ?? `Highlight ${index + 1}`,
    description: readString(entry, "description") ?? "Generated by the Authrix Engineering agent.",
    impact: readImpact(entry),
    relatedActivityIds: readStringArray(entry, "relatedActivityIds"),
  }));
}

function readRepoBreakdown(input: Record<string, unknown>): RepoSummary[] {
  return readArray(input, "repoBreakdown").map((entry, index) => ({
    repo: readString(entry, "repo") ?? `repo-${index + 1}`,
    commitCount: readNumber(entry, "commitCount"),
    prCount: readNumber(entry, "prCount"),
    issueCount: readNumber(entry, "issueCount"),
    summary: readString(entry, "summary") ?? "Generated by the Authrix Engineering agent.",
  }));
}

function readContributorBreakdown(input: Record<string, unknown>): ContributorSummary[] {
  return readArray(input, "contributorBreakdown").map((entry, index) => ({
    author: readString(entry, "author") ?? `Contributor ${index + 1}`,
    commitCount: readNumber(entry, "commitCount"),
    prCount: readNumber(entry, "prCount"),
    topRepos: readStringArray(entry, "topRepos"),
  }));
}

function readRiskFlags(input: Record<string, unknown>): RiskFlag[] {
  return readArray(input, "riskFlags").map((entry, index) => ({
    title: readString(entry, "title") ?? `Risk flag ${index + 1}`,
    description: readString(entry, "description") ?? "Generated by the Authrix Engineering agent.",
    severity: readSeverity(entry),
    relatedActivityIds: readStringArray(entry, "relatedActivityIds"),
  }));
}

function readStringArray(input: Record<string, unknown>, key: string): string[] {
  const value = input[key];
  return Array.isArray(value) ? value.filter((entry): entry is string => typeof entry === "string") : [];
}

function readString(input: Record<string, unknown>, key: string): string | undefined {
  const value = input[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readPriority(input: Record<string, unknown>): SuggestedTask["priority"] {
  const value = readString(input, "priority");
  return value === "critical" || value === "high" || value === "medium" || value === "low"
    ? value
    : "medium";
}

function readImpact(input: Record<string, unknown>): SummaryHighlight["impact"] {
  const value = readString(input, "impact");
  return value === "high" || value === "medium" ? value : "low";
}

function readSeverity(input: Record<string, unknown>): "low" | "medium" | "high" {
  const value = readString(input, "severity") ?? readString(input, "riskLevel");
  return value === "high" || value === "medium" ? value : "low";
}

function readNumber(input: Record<string, unknown>, key: string): number {
  const value = input[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function readWorkflowCategory(input: Record<string, unknown>): RiskAlert["category"] {
  const value = readString(input, "category");
  return value === "engineering" || value === "operations" || value === "drift"
    ? value
    : "workflow";
}

function toMeetingActionItem(
  sourceDocumentId: string,
  createdAt: string,
  input: Record<string, unknown>,
  index: number
): MeetingActionItem {
  return {
    id: `meeting-action-${sourceDocumentId}-${index + 1}`,
    title: readString(input, "title") ?? `Follow-up ${index + 1}`,
    description: readString(input, "description") ?? "Generated by the Authrix Docs agent.",
    owner: readString(input, "owner"),
    dueDate: readString(input, "dueDate"),
    status: "suggested",
  };
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}
