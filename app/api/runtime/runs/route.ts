import { NextRequest, NextResponse } from "next/server";
import { isAuthConfigured } from "@/lib/auth/auth0";
import { getOptionalSession } from "@/lib/auth/session";
import {
  listAuthrixRuntimeRuns,
  queueRuntimeAgentRun,
} from "@/lib/runtime/service";

export async function GET(request: NextRequest) {
  if (isAuthConfigured) {
    const session = await getOptionalSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const limit = parseLimit(request.nextUrl.searchParams.get("limit"), 12);
  const runs = await listAuthrixRuntimeRuns(limit);
  return NextResponse.json({ runs });
}

export async function POST(request: Request) {
  if (isAuthConfigured) {
    const session = await getOptionalSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const payload = (await request.json().catch(() => ({}))) as {
    agentId?: string;
    sessionId?: string;
    tools?: string[];
    origin?: "slack" | "web" | "api" | "system";
    label?: string;
    model?: string;
    metadata?: Record<string, unknown>;
    payload?: unknown;
  };

  if (!payload.agentId) {
    return NextResponse.json(
      { error: "agentId is required to queue a runtime run." },
      { status: 400 }
    );
  }

  const run = await queueRuntimeAgentRun({
    agentId: payload.agentId,
    sessionId: payload.sessionId,
    tools: payload.tools,
    origin: payload.origin,
    label: payload.label,
    model: payload.model,
    metadata: payload.metadata,
    payload: payload.payload ?? {},
  });

  return NextResponse.json({ run }, { status: 202 });
}

function parseLimit(raw: string | null, fallback: number): number {
  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, 100);
}
