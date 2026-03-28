import { NextRequest, NextResponse } from "next/server";
import type { ApprovalRequest } from "@/types/domain";

// In-memory mock store. Will be replaced by persistent storage.
const mockApprovals: ApprovalRequest[] = [
  {
    id: "approval-001",
    actionKind: "github.issue.create",
    title: "Create follow-up issue for cost anomaly",
    description:
      "The DevOps agent detected a 45% OpenAI API spend increase and wants to create a tracking issue.",
    sourceAgent: "devops",
    affectedSystem: "GitHub",
    riskLevel: "medium",
    status: "pending",
    requestedAt: "2026-03-27T12:00:00Z",
  },
  {
    id: "approval-002",
    actionKind: "github.issue.create",
    title: "Create task: review approval engine PR",
    description:
      "The Task agent generated a high-priority review task and wants to create an issue for tracking.",
    sourceAgent: "task",
    affectedSystem: "GitHub",
    riskLevel: "medium",
    status: "pending",
    requestedAt: "2026-03-27T14:00:00Z",
  },
  {
    id: "approval-003",
    actionKind: "docs.update",
    title: "Update architecture docs with new security model",
    description:
      "Docs are stale after the security architecture changes this week.",
    sourceAgent: "task",
    affectedSystem: "Documentation",
    riskLevel: "low",
    status: "approved",
    requestedAt: "2026-03-26T09:00:00Z",
    resolvedAt: "2026-03-26T10:00:00Z",
    resolvedBy: "kinshuk",
  },
];

export async function GET() {
  return NextResponse.json(mockApprovals);
}

export async function PATCH(request: NextRequest) {
  const body = await request.json();
  const { id, status } = body as { id: string; status: "approved" | "rejected" };

  const approval = mockApprovals.find((a) => a.id === id);
  if (!approval) {
    return NextResponse.json({ error: "Approval not found" }, { status: 404 });
  }

  approval.status = status;
  approval.resolvedAt = new Date().toISOString();
  approval.resolvedBy = "current-user"; // MOCK: replace with real auth

  return NextResponse.json(approval);
}
