import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/client";
import { engineerAgent } from "@/lib/agents/engineerAgent";
import type { NormalizedGitHubActivity } from "@/types/authrix";

export async function POST(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    activities?: NormalizedGitHubActivity[];
  };

  if (!body.activities) {
    return NextResponse.json({ error: "activities are required" }, { status: 400 });
  }

  return NextResponse.json(engineerAgent(body.activities));
}
