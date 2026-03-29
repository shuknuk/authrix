import { NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/session";
import { isAuthConfigured } from "@/lib/auth/auth0";
import { listWorkspaceJobs, submitWorkspaceRefreshJob } from "@/lib/data/jobs";

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

export async function POST() {
  if (isAuthConfigured) {
    const session = await getOptionalSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const job = await submitWorkspaceRefreshJob();
  return NextResponse.json({ job }, { status: 202 });
}
