import { NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/session";
import { isAuthConfigured } from "@/lib/auth/auth0";
import { refreshWorkspaceSnapshot } from "@/lib/data/workspace";
import { getGitHubIngestionResult } from "@/lib/github/service";

export async function GET() {
  if (isAuthConfigured) {
    const session = await getOptionalSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const github = await getGitHubIngestionResult();
  return NextResponse.json(github);
}

export async function POST() {
  if (isAuthConfigured) {
    const session = await getOptionalSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  await refreshWorkspaceSnapshot();
  const github = await getGitHubIngestionResult();

  return NextResponse.json(github);
}
