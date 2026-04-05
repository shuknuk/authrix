import { NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/session";
import { isAuth0Configured } from "@/lib/auth/config";
import { getGitHubActivityFeed } from "@/lib/github/service";

export async function GET() {
  if (!isAuth0Configured()) {
    return NextResponse.json(
      { error: "Auth0 is not configured." },
      { status: 503 },
    );
  }

  const session = await getOptionalSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(await getGitHubActivityFeed());
}
