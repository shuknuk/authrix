import { promises as fs } from "node:fs";
import path from "node:path";
import type { ApprovalRequest } from "@/types/domain";

interface ExecutionResult {
  success: boolean;
  message: string;
  metadata?: Record<string, unknown>;
}

const generatedDocsDir = path.join(process.cwd(), ".authrix-data", "generated-docs");
const generatedDocsFile = path.join(generatedDocsDir, "operational-updates.md");

export async function executeDocsApprovalAction(
  approval: ApprovalRequest
): Promise<ExecutionResult> {
  if (approval.actionKind !== "docs.update") {
    return {
      success: false,
      message: `No documentation execution adapter is registered for "${approval.actionKind}".`,
    };
  }

  await fs.mkdir(generatedDocsDir, { recursive: true });

  const timestamp = new Date().toISOString();
  const entry = [
    `## ${approval.title}`,
    "",
    approval.description,
    "",
    `- Approval id: ${approval.id}`,
    `- Source agent: ${approval.sourceAgent}`,
    `- Risk level: ${approval.riskLevel}`,
    `- Executed at: ${timestamp}`,
    "",
  ].join("\n");

  await fs.appendFile(generatedDocsFile, `${entry}\n`, "utf8");

  return {
    success: true,
    message: `Documentation update recorded successfully in ${generatedDocsFile}.`,
    metadata: {
      filePath: generatedDocsFile,
      approvalId: approval.id,
    },
  };
}
