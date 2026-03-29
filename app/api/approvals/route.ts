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

  const body = await request.json();
  const { id, status } = body as { id: string; status: "approved" | "rejected" };
  const actor =
    session?.user.name ?? session?.user.email ?? "current-user";

  const approval = await updateApprovalRequest(id, status, actor);
  if (!approval) {
    return NextResponse.json({ error: "Approval not found" }, { status: 404 });
  }

  if (status === "approved") {
    const latestApproval = await getApprovalRequestById(id);
    if (latestApproval) {
      const execution = await executeApprovalAction(latestApproval);
      const finalizedApproval = await recordApprovalExecutionResult(id, execution);
      return NextResponse.json(finalizedApproval ?? approval);
    }
  }

  return NextResponse.json(approval);
}
