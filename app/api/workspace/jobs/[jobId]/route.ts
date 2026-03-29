import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/session";
import { isAuthConfigured } from "@/lib/auth/auth0";
import { getWorkspaceJob } from "@/lib/data/jobs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ jobId: string }> }
) {
  if (isAuthConfigured) {
    const session = await getOptionalSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { jobId } = await context.params;
  const job = await getWorkspaceJob(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({ job });
}
