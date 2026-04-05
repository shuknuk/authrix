import { NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/session";
import { isAuthConfigured } from "@/lib/auth/auth0";
import {
  listWorkspaceJobs,
  submitProactiveReviewJob,
  submitSlackBriefingJob,
  submitWorkflowFollowUpJob,
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
    type?:
      | "workspace.refresh"
      | "slack.briefing.run"
      | "workflow.followup.run"
      | "workspace.proactive.review";
    scheduleId?: string;
  };

  const job =
    payload.type === "slack.briefing.run"
      ? await submitSlackBriefingJob(payload.scheduleId)
      : payload.type === "workspace.proactive.review"
        ? await submitProactiveReviewJob()
      : payload.type === "workflow.followup.run"
        ? await submitWorkflowFollowUpJob()
        : await submitWorkspaceRefreshJob();

  return NextResponse.json({ job }, { status: 202 });
}
