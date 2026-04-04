import { executeApprovalAction } from "@/lib/actions/execute-approval";
import {
  getApprovalRequestById,
  getApprovalRequests,
  recordApprovalExecutionResult,
  updateApprovalRequest,
} from "@/lib/data/workspace";
import { getActionPolicy } from "@/lib/security/action-policy";
import { recordSecurityEvent } from "@/lib/security/events";
import type { ApprovalRequest } from "@/types/domain";

export function resolveSlackApprovalIntent(text: string):
  | { kind: "queue" }
  | { kind: "approve"; approvalId: string }
  | { kind: "reject"; approvalId: string }
  | null {
  const normalized = text.replace(/<@[^>]+>/g, "").replace(/\s+/g, " ").trim().toLowerCase();

  const directActionMatch = normalized.match(/\b(approve|reject)\s+(approval-\d+)\b/);
  if (directActionMatch) {
    return {
      kind: directActionMatch[1] === "approve" ? "approve" : "reject",
      approvalId: directActionMatch[2],
    };
  }

  if (
    normalized.includes("approval queue") ||
    normalized.includes("show approvals") ||
    normalized.includes("pending approvals") ||
    normalized === "approvals" ||
    normalized === "approval"
  ) {
    return { kind: "queue" };
  }

  return null;
}

export async function listPendingApprovalsForSlack(limit = 5): Promise<ApprovalRequest[]> {
  const approvals = await getApprovalRequests();
  return approvals.filter((approval) => approval.status === "pending").slice(0, limit);
}

export function buildSlackApprovalQueueText(approvals: ApprovalRequest[]): string {
  if (approvals.length === 0) {
    return "*Authrix - Approvals*\nNo pending approvals are waiting right now.";
  }

  const lines = [
    "*Authrix - Approvals*",
    `Pending approvals: ${approvals.length}`,
    ...approvals.map(
      (approval) =>
        `- ${approval.id}: ${approval.title} (${approval.riskLevel}, ${approval.affectedSystem})`
    ),
  ];

  return lines.join("\n");
}

export function buildSlackApprovalBlocks(approvals: ApprovalRequest[]): unknown[] {
  const blocks: unknown[] = [];

  for (const approval of approvals) {
    const policy = getActionPolicy(approval.actionKind);
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text:
          `*${approval.title}*\n` +
          `${approval.description}\n` +
          `Risk: *${approval.riskLevel}* | Target: *${approval.affectedSystem}* | Tier: *${policy.executionTier}*\n` +
          `Approval id: \`${approval.id}\``,
      },
    });
    blocks.push({
      type: "actions",
      elements: [
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Approve",
          },
          style: "primary",
          action_id: "approval.approve",
          value: approval.id,
        },
        {
          type: "button",
          text: {
            type: "plain_text",
            text: "Reject",
          },
          style: "danger",
          action_id: "approval.reject",
          value: approval.id,
        },
      ],
    });
    blocks.push({
      type: "divider",
    });
  }

  return blocks;
}

export async function resolveSlackApprovalAction(input: {
  approvalId: string;
  status: "approved" | "rejected";
  actor: string;
}): Promise<string> {
  const existingApproval = await getApprovalRequestById(input.approvalId);
  if (!existingApproval) {
    return `Approval ${input.approvalId} was not found.`;
  }

  if (existingApproval.status !== "pending") {
    return `Approval ${input.approvalId} has already been resolved as ${existingApproval.status}.`;
  }

  const approval = await updateApprovalRequest(input.approvalId, input.status, input.actor);
  if (!approval) {
    return `Approval ${input.approvalId} could not be updated.`;
  }

  if (input.status === "approved") {
    const latestApproval = await getApprovalRequestById(input.approvalId);
    if (latestApproval) {
      const execution = await executeApprovalAction(latestApproval);
      await recordApprovalExecutionResult(input.approvalId, execution);

      if (execution.metadata?.policyBlocked === true) {
        await recordSecurityEvent({
          level: "warning",
          category: "approval_policy",
          title: "Approved write blocked by policy",
          description: execution.message,
          metadata: {
            approvalId: input.approvalId,
            actionKind: latestApproval.actionKind,
            target: latestApproval.affectedSystem,
          },
        });
      }

      return `Approved ${latestApproval.title}. ${execution.message}`;
    }
  }

  return `Rejected ${approval.title}. No external action was executed.`;
}
