import { NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/session";
import { isAuthConfigured } from "@/lib/auth/auth0";
import { recordExecution } from "@/lib/orchestrator/approval-store";
import type { ApprovalRequest, ExecutionResult } from "@/types/authrix";

const supportedActions = new Set<ApprovalRequest["action"]>([
  "create_tasks",
  "sync_followups",
  "open_issue",
]);

export async function POST(request: Request) {
  if (isAuthConfigured) {
    const session = await getOptionalSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body = (await request.json()) as ApprovalRequest & {
    approved?: boolean;
    actor?: string;
  };

  if (!body.approved) {
    return NextResponse.json(
      { error: "Approval flag is required before execution." },
      { status: 400 },
    );
  }

  if (!supportedActions.has(body.action)) {
    return NextResponse.json(
      { error: "Unsupported action requested." },
      { status: 400 },
    );
  }

  const actor = body.actor ?? "Authrix user";
  const queueItem = recordExecution(
    body.label,
    actor,
    `Executed ${body.action} with explicit user approval. This is a simulated backend action for the MVP demo.`,
  );

  const response: ExecutionResult = {
    ok: true,
    message: "Action approved and executed through the controlled backend layer.",
    queueItem,
    simulated: true,
  };

  return NextResponse.json(response);
}
