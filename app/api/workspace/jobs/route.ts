import { NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/session";
import { isAuthConfigured } from "@/lib/auth/auth0";
import {
  listWorkspaceJobs,
  submitSlackBriefingJob,
  submitWorkspaceRefreshJob,
} from "@/lib/data/jobs";

export async function GET() {
  if (isAuthConfigured) {
    const session = await getOptionalSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const jobs = await listWorkspaceJobs();
  return NextResponse.json({ jobs });
}

export async function POST(request: Request) {
  if (isAuthConfigured) {
    const session = await getOptionalSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const payload = (await request.json().catch(() => ({}))) as {
    type?: "workspace.refresh" | "slack.briefing.run";
    scheduleId?: string;
  };

  const job =
    payload.type === "slack.briefing.run"
      ? await submitSlackBriefingJob(payload.scheduleId)
      : await submitWorkspaceRefreshJob();

  return NextResponse.json({ job }, { status: 202 });
}
