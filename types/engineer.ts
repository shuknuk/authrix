export type EngineerExecutionStatus =
  | "completed"
  | "failed"
  | "needs_clarification";

export interface EngineerRepoBinding {
  repository: string;
  sourceRepoPath: string;
  workspaceDir: string;
  baseBranch: string;
  branchName: string;
  source: "env" | "cwd";
}

export interface EngineerCheckResult {
  name: string;
  command: string;
  status: "passed" | "failed" | "skipped";
  outputSummary?: string;
}

export interface EngineerExecutionRecord {
  id: string;
  sessionId: string;
  runId: string;
  request: string;
  status: EngineerExecutionStatus;
  createdAt: string;
  updatedAt: string;
  repository: string;
  sourceRepoPath: string;
  workspaceDir: string;
  baseBranch: string;
  branchName: string;
  plan: string[];
  changedFiles: string[];
  diffSummary?: string;
  commitMessage?: string;
  commitSha?: string;
  prTitle?: string;
  prBody?: string;
  checks: EngineerCheckResult[];
  approvalRequestId?: string;
  clarificationQuestion?: string;
  outputSummary?: string;
  error?: string;
  metadata: Record<string, unknown>;
}
