import { NextRequest, NextResponse } from "next/server";
import { isAuthConfigured } from "@/lib/auth/auth0";
import { getOptionalSession } from "@/lib/auth/session";
import { getRuntimeRunDetails } from "@/lib/runtime/service";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ runId: string }> }
) {
  if (isAuthConfigured) {
    const session = await getOptionalSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { runId } = await context.params;
  const details = await getRuntimeRunDetails(runId);

  if (!details) {
    return NextResponse.json({ error: "Runtime run not found" }, { status: 404 });
  }

  return NextResponse.json(details);
}
