import type { AgentId } from "@/types/agents";

export function routeSlackMessageToAgent(text: string): AgentId {
  const normalized = text.toLowerCase();

  if (matchesAny(normalized, ["cost", "spend", "billing", "infra", "ops", "vercel", "supabase"])) {
    return "devops";
  }

  if (matchesAny(normalized, ["task", "owner", "follow-up", "follow up", "assign", "accountability"])) {
    return "workflow";
  }

  if (matchesAny(normalized, ["docs", "document", "meeting", "transcript", "notes", "decision"])) {
    return "docs";
  }

  return "engineer";
}

function matchesAny(input: string, patterns: string[]): boolean {
  return patterns.some((pattern) => input.includes(pattern));
}
