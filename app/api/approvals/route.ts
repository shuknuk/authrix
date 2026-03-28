import { NextRequest, NextResponse } from "next/server";
import {
  getApprovalRequests,
  updateApprovalRequest,
} from "@/lib/data/workspace";

export async function GET() {
  const approvals = await getApprovalRequests();
  return NextResponse.json(approvals);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, status } = body as { id: string; status: "approved" | "rejected" };

  const approval = await updateApprovalRequest(id, status);
  if (!approval) {
    return NextResponse.json({ error: "Approval not found" }, { status: 404 });
  }

  return NextResponse.json(approval);
}
