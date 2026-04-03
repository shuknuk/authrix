import type { RoutedSlackAgentId } from "@/types/messaging";

const VAGUE_REQUESTS = new Set([
  "help",
  "do it",
  "fix it",
  "handle it",
  "look into it",
  "can you do this",
  "can you help",
  "please help",
]);

export function resolveSlackClarifyingQuestion(input: {
  text: string;
  routedAgentId: RoutedSlackAgentId;
  hasRuntimeSession: boolean;
}): string | null {
  if (input.hasRuntimeSession) {
    return null;
  }

  const normalized = input.text.replace(/<@[^>]+>/g, "").replace(/\s+/g, " ").trim().toLowerCase();
  if (!normalized) {
    return fallbackQuestion(input.routedAgentId);
  }

  const wordCount = normalized.split(" ").filter(Boolean).length;
  const lacksConcreteContext = !/[#/./:_-]/.test(normalized) && !hasConcreteKeyword(normalized);
  if (VAGUE_REQUESTS.has(normalized) || (wordCount <= 3 && lacksConcreteContext)) {
    return fallbackQuestion(input.routedAgentId);
  }

  return null;
}

export function buildSlackClarifyingReply(input: {
  routedAgentId: RoutedSlackAgentId;
  question: string;
}): string {
  const label = formatAgentLabel(input.routedAgentId);
  return `*Authrix - ${label}*\nI need one detail before I start a durable thread run.\n_${input.question}_`;
}

function fallbackQuestion(agentId: RoutedSlackAgentId): string {
  if (agentId === "docs") {
    return "What notes, meeting, transcript, or document should Docs work from?";
  }

  if (agentId === "workflow") {
    return "Which follow-up, owner assignment, or deadline should Workflow organize?";
  }

  if (agentId === "devops") {
    return "What cost, deployment, or operational issue should DevOps investigate?";
  }

  return "What repo, file, or engineering change should Engineer work on?";
}

function hasConcreteKeyword(value: string): boolean {
  return [
    "repo",
    "github",
    "issue",
    "pr",
    "branch",
    "logo",
    "backend",
    "frontend",
    "api",
    "slack",
    "meeting",
    "notes",
    "approval",
    "cost",
    "billing",
    "deploy",
    "owner",
    "deadline",
    "ticket",
  ].some((keyword) => value.includes(keyword));
}

function formatAgentLabel(agentId: RoutedSlackAgentId): string {
  if (agentId === "docs") {
    return "Docs";
  }

  if (agentId === "workflow") {
    return "Workflow";
  }

  if (agentId === "devops") {
    return "DevOps";
  }

  return "Engineer";
}
