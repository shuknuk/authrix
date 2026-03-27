import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/client";
import { isAuth0Configured } from "@/lib/auth/config";
import { getGitHubActivityFeed } from "@/lib/github/service";

export async function GET() {
  if (!isAuth0Configured()) {
    return NextResponse.json(
      { error: "Auth0 is not configured." },
      { status: 503 },
    );
  }

  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await getGitHubActivityFeed());
}
