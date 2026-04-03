import { NextRequest, NextResponse } from "next/server";
import { isAuthConfigured } from "@/lib/auth/auth0";
import { getOptionalSession } from "@/lib/auth/session";
import {
  createRuntimeSession,
  listAuthrixRuntimeSessions,
} from "@/lib/runtime/service";

export async function GET(request: NextRequest) {
  if (isAuthConfigured) {
    const session = await getOptionalSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const limit = parseLimit(request.nextUrl.searchParams.get("limit"), 12);
  const sessions = await listAuthrixRuntimeSessions(limit);
  return NextResponse.json({ sessions });
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
    label?: string;
    model?: string;
    origin?: "slack" | "web" | "api" | "system";
    metadata?: Record<string, unknown>;
  };

  if (!payload.agentId) {
    return NextResponse.json(
      { error: "agentId is required to create a runtime session." },
      { status: 400 }
    );
  }

  const session = await createRuntimeSession({
    agentId: payload.agentId,
    label: payload.label,
    model: payload.model,
    origin: payload.origin,
    metadata: payload.metadata,
  });

  return NextResponse.json({ session }, { status: 201 });
}

function parseLimit(raw: string | null, fallback: number): number {
  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallback;
  }

  return Math.min(parsed, 100);
}
