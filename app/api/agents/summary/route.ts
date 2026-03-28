import { NextResponse } from "next/server";
import { engineerAgent } from "@/lib/agents/engineer";
import { mockGitHubEvents, normalizeGitHubEvents } from "@/lib/mock/github-activity";
import type { EngineerAgentInput } from "@/types/agents";

export async function GET() {
  const activities = normalizeGitHubEvents(mockGitHubEvents);

  const input: EngineerAgentInput = {
    activities,
    period: {
      start: "2026-03-21T00:00:00Z",
      end: "2026-03-28T00:00:00Z",
    },
  };

  const result = engineerAgent(input);

  return NextResponse.json(result.summary);
}
