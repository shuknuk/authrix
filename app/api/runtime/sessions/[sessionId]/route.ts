import { NextRequest, NextResponse } from "next/server";
import { isAuthConfigured } from "@/lib/auth/auth0";
import { getOptionalSession } from "@/lib/auth/session";
import { getRuntimeSessionDetails } from "@/lib/runtime/service";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ sessionId: string }> }
) {
  if (isAuthConfigured) {
    const session = await getOptionalSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const { sessionId } = await context.params;
  const transcriptLimit = parseLimit(
    request.nextUrl.searchParams.get("transcriptLimit"),
    100
  );
  const details = await getRuntimeSessionDetails(sessionId, transcriptLimit);

  if (!details) {
    return NextResponse.json({ error: "Runtime session not found" }, { status: 404 });
  }

  return NextResponse.json(details);
}

function parseLimit(raw: string | null, fallback: number): number {
  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, 250);
}
