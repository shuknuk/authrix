import type { AgentId } from "@/types/agents";
import type {
  NormalizedSlackMessage,
  RoutedSlackAgentId,
  SlackDelegationRecord,
  SlackTaskDispatchRecord,
} from "@/types/messaging";
import type { RouteDecision } from "@/types/models";
import type { JobState } from "@/types/runtime";

const WORKSPACE_ID = "workspace-authrix";

export function planSlackDelegations(input: {
  message: NormalizedSlackMessage;
  routedAgentId: RoutedSlackAgentId;
  routeDecision: RouteDecision;
  sourceMessageId: string;
  conversationId: string;
  createdAt: string;
}): SlackDelegationRecord[] {
  const candidates = detectInterestedAgents(input.message.text).filter(
    (agentId) => agentId !== input.routedAgentId && agentId !== "task"
  ) as RoutedSlackAgentId[];

  return dedupeAgents(candidates).map((agentId, index) => ({
    id: `slack_delegate_${Date.now()}_${index}_${Math.random().toString(36).slice(2, 8)}`,
    workspaceId: WORKSPACE_ID,
    conversationId: input.conversationId,
    sourceMessageId: input.sourceMessageId,
    parentAgentId: input.routedAgentId,
    delegatedAgentId: agentId,
    reason: buildDelegationReason(agentId, input.message.text, input.routeDecision),
    status: "delegated",
    createdAt: input.createdAt,
  }));
}

export function planSlackTaskDispatches(input: {
  message: NormalizedSlackMessage;
  routedAgentId: RoutedSlackAgentId;
  sourceMessageId: string;
  conversationId: string;
  createdAt: string;
}): SlackTaskDispatchRecord[] {
  if (!shouldCreateTaskDispatch(input.message.text, input.routedAgentId)) {
    return [];
  }

  const title = buildTaskTitle(input.message.text);
  if (!title) {
    return [];
  }

  const suggestedOwner = extractSuggestedOwner(input.message.text);
  const assignedAgentId =
    input.routedAgentId === "workflow"
      ? "workflow"
      : input.routedAgentId === "docs"
        ? "docs"
        : input.routedAgentId === "devops"
          ? "devops"
          : "workflow";

  return [
    {
      id: `slack_task_dispatch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      workspaceId: WORKSPACE_ID,
      conversationId: input.conversationId,
      sourceMessageId: input.sourceMessageId,
      workspaceTaskId: `task_slack_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      title,
      description: buildTaskDescription(input.message.text),
      suggestedOwner,
      priority: inferTaskPriority(input.message.text),
      assignedAgentId,
      status: "suggested",
      sourceText: input.message.text,
      createdAt: input.createdAt,
    },
  ];
}

export function buildSlackAcknowledgement(input: {
  routedAgentId: RoutedSlackAgentId;
  routeReason: string;
  delegations: SlackDelegationRecord[];
  taskDispatches: SlackTaskDispatchRecord[];
  runtime:
    | {
        sessionMode: "created" | "reused";
        sessionId: string;
        runId: string;
        runStatus: JobState;
      }
    | {
        error: string;
      };
}): string {
  const label = formatAgentLabel(input.routedAgentId);
  const lines = [`*Authrix - ${label}*`];

  if ("error" in input.runtime) {
    lines.push(
      "Your request has been recorded in the control tower, but the live runtime could not be started yet."
    );
    lines.push(`_Runtime error: ${truncateForSlack(input.runtime.error, 220)}_`);
  } else {
    lines.push(
      input.runtime.sessionMode === "reused"
        ? "Continuing this Slack thread in the same persistent runtime session."
        : "Started a new persistent runtime session for this Slack thread."
    );
    lines.push("Queued live runtime work and will post the result back into this thread.");
    lines.push(
      `Session \`${shortId(input.runtime.sessionId)}\` | Run \`${shortId(input.runtime.runId)}\``
    );
  }

  lines.push(`_${input.routeReason}_`);

  if (input.delegations.length > 0) {
    lines.push(
      `Delegating to ${input.delegations.map((item) => formatAgentLabel(item.delegatedAgentId)).join(", ")} for follow-through.`
    );
  }

  if (input.taskDispatches.length > 0) {
    lines.push(
      `Captured ${input.taskDispatches.length} follow-up ${input.taskDispatches.length === 1 ? "task" : "tasks"} from chat.`
    );
  }

  return lines.join("\n");
}

export function buildSlackRunOutcomeReply(input: {
  routedAgentId: RoutedSlackAgentId;
  status: "completed" | "failed" | "running";
  outputSummary?: string;
  error?: string;
  sessionId: string;
  runId: string;
}): string {
  const label = formatAgentLabel(input.routedAgentId);
  const lines = [`*Authrix - ${label}*`];

  if (input.status === "completed") {
    lines.push("Completed the latest thread run.");
    if (input.outputSummary) {
      lines.push(formatSummaryBlock(input.outputSummary));
    }
  } else if (input.status === "failed") {
    lines.push("The latest thread run failed.");
    lines.push(`_${truncateForSlack(input.error ?? "Unknown runtime error.")}_`);
  } else {
    lines.push("The latest thread run is still in progress.");
  }

  lines.push(`Session \`${shortId(input.sessionId)}\` | Run \`${shortId(input.runId)}\``);
  return lines.join("\n");
}

export function formatAgentLabel(agentId: AgentId): string {
  if (agentId === "docs") {
    return "Docs";
  }

  if (agentId === "workflow" || agentId === "task") {
    return "Workflow";
  }

  if (agentId === "devops") {
    return "Finance/Ops";
  }

  return "Engineer";
}

function detectInterestedAgents(text: string): AgentId[] {
  const normalized = text.toLowerCase();
  const interested = new Set<AgentId>();

  if (matchesAny(normalized, ["code", "repo", "github", "pr", "auth", "migration", "ship"])) {
    interested.add("engineer");
  }

  if (matchesAny(normalized, ["docs", "document", "meeting", "summary", "notes", "decision"])) {
    interested.add("docs");
  }

  if (matchesAny(normalized, ["task", "follow up", "follow-up", "assign", "owner", "todo"])) {
    interested.add("workflow");
  }

  if (
    matchesAny(normalized, [
      "cost",
      "spend",
      "ops",
      "billing",
      "infra",
      "deploy",
      "finance",
      "pricing",
      "budget",
      "burn",
      "runway",
    ])
  ) {
    interested.add("devops");
  }

  return [...interested];
}

function buildDelegationReason(
  delegatedAgentId: RoutedSlackAgentId,
  text: string,
  routeDecision: RouteDecision
): string {
  const domainReason =
    delegatedAgentId === "docs"
      ? "The request includes durable documentation or meeting capture work."
      : delegatedAgentId === "workflow"
        ? "The request includes ownership or follow-up work that should be tracked."
        : delegatedAgentId === "devops"
          ? "The request includes finance, spend, or operational review."
          : "The request includes engineering execution work.";

  if (routeDecision.mode === "model") {
    return `${domainReason} Routed after model classification of: "${truncate(text)}".`;
  }

  return `${domainReason} Routed after deterministic classification of: "${truncate(text)}".`;
}

function buildTaskTitle(text: string): string {
  const normalized = text
    .replace(/<@[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
  if (!normalized) {
    return "";
  }

  const clipped = normalized.length > 72 ? `${normalized.slice(0, 69)}...` : normalized;
  return `Slack follow-up: ${clipped}`;
}

function buildTaskDescription(text: string): string {
  return `Created from Slack conversation follow-through.\n\n${text.trim()}`;
}

function extractSuggestedOwner(text: string): string | undefined {
  const mentionMatch = text.match(/<@([^>]+)>/);
  if (mentionMatch) {
    return mentionMatch[1];
  }

  const ownerMatch = text.match(/owner[:\s]+([a-z0-9._-]+)/i);
  return ownerMatch?.[1];
}

function inferTaskPriority(text: string): "low" | "medium" | "high" {
  const normalized = text.toLowerCase();
  if (matchesAny(normalized, ["urgent", "asap", "critical", "blocker", "today"])) {
    return "high";
  }

  if (matchesAny(normalized, ["soon", "follow up", "follow-up", "review", "assign"])) {
    return "medium";
  }

  return "low";
}

function shouldCreateTaskDispatch(text: string, routedAgentId: RoutedSlackAgentId): boolean {
  const normalized = text.toLowerCase();
  if (routedAgentId === "workflow") {
    return true;
  }

  return matchesAny(normalized, [
    "follow up",
    "follow-up",
    "assign",
    "todo",
    "task",
    "owner",
    "need to",
    "please",
    "investigate",
    "document",
  ]);
}

function truncate(value: string): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > 64 ? `${normalized.slice(0, 61)}...` : normalized;
}

function matchesAny(input: string, patterns: string[]): boolean {
  return patterns.some((pattern) => input.includes(pattern));
}

function dedupeAgents<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function shortId(value: string): string {
  return value.length > 12 ? `${value.slice(0, 12)}...` : value;
}

function formatSummaryBlock(value: string): string {
  return `\`\`\`\n${truncateForSlack(value)}\n\`\`\``;
}

function truncateForSlack(value: string, maxLength = 700): string {
  const normalized = value.trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength - 3)}...` : normalized;
}
