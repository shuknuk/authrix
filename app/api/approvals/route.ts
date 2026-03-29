import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/session";
import { isAuthConfigured } from "@/lib/auth/auth0";
import {
  getApprovalRequestById,
  getApprovalRequests,
  recordApprovalExecutionResult,
  updateApprovalRequest,
} from "@/lib/data/workspace";
import { executeApprovalAction } from "@/lib/actions/execute-approval";
import { recordSecurityEvent } from "@/lib/security/events";

export async function GET() {
  if (isAuthConfigured) {
    const session = await getOptionalSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const approvals = await getApprovalRequests();
  return NextResponse.json(approvals);
}

export async function PATCH(request: NextRequest) {
  const session = isAuthConfigured ? await getOptionalSession() : null;

  if (isAuthConfigured) {
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const body = (await request.json()) as {
    id?: unknown;
    status?: unknown;
  };
  const id = typeof body.id === "string" ? body.id : null;
  const status =
    body.status === "approved" || body.status === "rejected" ? body.status : null;

  if (!id || !status) {
    return NextResponse.json(
      { error: "A valid approval id and status are required." },
      { status: 400 }
    );
  }

  const actor =
    session?.user.name ?? session?.user.email ?? "current-user";
  const existingApproval = await getApprovalRequestById(id);

  if (!existingApproval) {
    return NextResponse.json({ error: "Approval not found" }, { status: 404 });
  }

  if (existingApproval.status !== "pending") {
    return NextResponse.json(
      { error: `Approval ${id} has already been resolved.` },
      { status: 409 }
    );
  }

  const approval = await updateApprovalRequest(id, status, actor);
  if (!approval) {
    return NextResponse.json({ error: "Approval not found" }, { status: 404 });
  }

  if (status === "approved") {
    const latestApproval = await getApprovalRequestById(id);
    if (latestApproval) {
      const execution = await executeApprovalAction(latestApproval);
      const finalizedApproval = await recordApprovalExecutionResult(id, execution);

      if (execution.metadata?.policyBlocked === true) {
        await recordSecurityEvent({
          level: "warning",
          category: "approval_policy",
          title: "Approved write blocked by policy",
          description: execution.message,
          metadata: {
            approvalId: id,
            actionKind: latestApproval.actionKind,
            target: latestApproval.affectedSystem,
          },
        });
      }

      return NextResponse.json(finalizedApproval ?? approval);
    }
  }

  return NextResponse.json(approval);
}
