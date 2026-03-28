import { NextResponse } from "next/server";
import { engineerAgent } from "@/lib/agents/engineer";
import { taskAgent } from "@/lib/agents/task";
import { mockGitHubEvents, normalizeGitHubEvents } from "@/lib/mock/github-activity";
import type { EngineerAgentInput } from "@/types/agents";

export async function GET() {
  // Output-based chaining: engineer → task
  const activities = normalizeGitHubEvents(mockGitHubEvents);

  const engineerInput: EngineerAgentInput = {
    activities,
    period: {
      start: "2026-03-21T00:00:00Z",
      end: "2026-03-28T00:00:00Z",
    },
  };

  const { summary } = engineerAgent(engineerInput);
  const { tasks } = taskAgent({ summary });

  return NextResponse.json(tasks);
}
