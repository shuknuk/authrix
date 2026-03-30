import { NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/session";
import { loadSlackWorkspaceState } from "@/lib/slack/store";

export async function GET() {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const state = await loadSlackWorkspaceState();
  return NextResponse.json(state);
}
