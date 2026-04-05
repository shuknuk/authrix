import { NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/session";
import { isAuthConfigured } from "@/lib/auth/auth0";
import { taskAgent } from "@/lib/agents/taskAgent";
import type { WeeklySummary } from "@/types/authrix";

export async function POST(request: Request) {
  if (isAuthConfigured) {
    const session = await getOptionalSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body = (await request.json()) as {
    summary?: WeeklySummary;
  };

  if (!body.summary) {
    return NextResponse.json({ error: "summary is required" }, { status: 400 });
  }

  return NextResponse.json({ tasks: taskAgent(body.summary) });
}
