import { executeDocsApprovalAction } from "@/lib/docs/write";
import { executeGitHubApprovalAction } from "@/lib/github/write";
import { isNotionConfigured } from "@/lib/notion/service";
import { executeNotionDocsUpdate } from "@/lib/notion/write";
import type { ApprovalRequest } from "@/types/domain";

interface ExecutionResult {
  success: boolean;
  message: string;
  metadata?: Record<string, unknown>;
}

export async function executeApprovalAction(
  approval: ApprovalRequest
): Promise<ExecutionResult> {
  if (approval.status !== "approved") {
    return {
      success: false,
      message: `Approval "${approval.id}" cannot execute because its status is "${approval.status}".`,
    };
  }

  if (approval.actionKind === "github.issue.create") {
    return executeGitHubApprovalAction(approval);
  }

  if (approval.actionKind === "docs.update") {
    if (isNotionConfigured()) {
      return executeNotionDocsUpdate(approval);
    }

    return executeDocsApprovalAction(approval);
  }

  return {
    success: false,
    message: `No execution adapter is registered for "${approval.actionKind}".`,
  };
}
