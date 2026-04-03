import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { getGitHubTokenVaultAccessToken } from "@/lib/auth/token-vault";
import { updateEngineerExecutionRecord } from "@/lib/engineer/store";
import {
  allowGitHubPersonalAccessTokenFallback,
  areExternalWritesEnabled,
  getExternalWritePolicyMessage,
} from "@/lib/security/config";
import type { ApprovalRequest } from "@/types/domain";

interface ExecutionResult {
  success: boolean;
  message: string;
  metadata?: Record<string, unknown>;
}

interface GitHubTargetRepository {
  owner: string;
  repo: string;
  repository: string;
}

const execFileAsync = promisify(execFile);

const githubEnv = {
  owner: process.env.GITHUB_OWNER,
  repo: process.env.GITHUB_REPO,
  personalAccessToken: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
} as const;

export async function executeGitHubApprovalAction(
  approval: ApprovalRequest
): Promise<ExecutionResult> {
  const targetRepo = resolveGitHubTargetRepository(approval);
  if (!targetRepo) {
    return {
      success: false,
      message:
        "GitHub write execution is not configured because the target repository could not be resolved.",
    };
  }

  if (!areExternalWritesEnabled()) {
    return {
      success: false,
      message: getExternalWritePolicyMessage("GitHub"),
      metadata: {
        policyBlocked: true,
        policy: "external-write-policy",
        target: "GitHub",
      },
    };
  }

  const token = await resolveGitHubWriteToken();
  if (!token) {
    return {
      success: false,
      message: allowGitHubPersonalAccessTokenFallback()
        ? "GitHub write execution requires a Token Vault GitHub connection or a configured personal access token."
        : "GitHub write execution requires a Token Vault GitHub connection. Personal access token fallback is disabled by policy.",
      metadata: {
        missingCredential: true,
        target: "GitHub",
      },
    };
  }

  if (approval.actionKind === "github.issue.create") {
    return createIssue(token, approval, targetRepo);
  }

  if (approval.actionKind === "github.branch.push") {
    return pushPreparedBranch(token, approval, targetRepo);
  }

  if (approval.actionKind === "github.pull_request.create") {
    return createDraftPullRequest(token, approval, targetRepo);
  }

  if (approval.actionKind === "github.pull_request.comment") {
    return commentOnPullRequest(token, approval, targetRepo);
  }

  if (approval.actionKind === "github.pull_request.merge") {
    return mergePullRequest(token, approval, targetRepo);
  }

  return {
    success: false,
    message: `No GitHub execution adapter is registered for "${approval.actionKind}".`,
  };
}

async function createIssue(
  token: string,
  approval: ApprovalRequest,
  targetRepo: GitHubTargetRepository
): Promise<ExecutionResult> {
  const response = await fetch(githubApiUrl(targetRepo, "issues"), {
    method: "POST",
    headers: buildGitHubHeaders(token),
    body: JSON.stringify({
      title: approval.title,
      body: buildIssueBody(approval),
    }),
  });

  if (!response.ok) {
    return buildGitHubFailure("issue creation", response);
  }

  const issue = (await response.json()) as {
    html_url?: string;
    number?: number;
  };

  return {
    success: true,
    message: `GitHub issue created successfully${issue.html_url ? `: ${issue.html_url}` : "."}`,
    metadata: {
      issueUrl: issue.html_url,
      issueNumber: issue.number,
      repository: targetRepo.repository,
    },
  };
}

async function pushPreparedBranch(
  token: string,
  approval: ApprovalRequest,
  targetRepo: GitHubTargetRepository
): Promise<ExecutionResult> {
  const metadata = readApprovalMetadata(approval);
  const workspaceDir = readRequiredString(metadata, "workspaceDir");
  const branchName = readRequiredString(metadata, "branchName");

  if (!workspaceDir || !branchName) {
    return {
      success: false,
      message:
        "GitHub branch push is missing the local workspaceDir or branchName in approval metadata.",
    };
  }

  try {
    await pushBranch(workspaceDir, branchName, token, targetRepo);
    return {
      success: true,
      message: `GitHub branch pushed successfully: ${branchName}.`,
      metadata: {
        branchName,
        repository: targetRepo.repository,
      },
    };
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "GitHub branch push failed for an unknown reason.",
    };
  }
}

async function createDraftPullRequest(
  token: string,
  approval: ApprovalRequest,
  targetRepo: GitHubTargetRepository
): Promise<ExecutionResult> {
  const metadata = readApprovalMetadata(approval);
  const workspaceDir = readRequiredString(metadata, "workspaceDir");
  const branchName = readRequiredString(metadata, "branchName");
  const baseBranch = readRequiredString(metadata, "baseBranch") ?? "main";
  const engineerExecutionId = readRequiredString(metadata, "engineerExecutionId");

  if (!workspaceDir || !branchName) {
    return {
      success: false,
      message:
        "GitHub draft pull request creation is missing the local workspaceDir or branchName in approval metadata.",
    };
  }

  try {
    await pushBranch(workspaceDir, branchName, token, targetRepo);
  } catch (error) {
    return {
      success: false,
      message:
        error instanceof Error
          ? error.message
          : "GitHub branch push failed before PR creation.",
    };
  }

  const response = await fetch(githubApiUrl(targetRepo, "pulls"), {
    method: "POST",
    headers: buildGitHubHeaders(token),
    body: JSON.stringify({
      title: approval.title,
      body: approval.description,
      head: branchName,
      base: baseBranch,
      draft: true,
    }),
  });

  if (!response.ok) {
    return buildGitHubFailure("draft pull request creation", response);
  }

  const pr = (await response.json()) as {
    html_url?: string;
    number?: number;
  };

  if (engineerExecutionId) {
    await updateEngineerExecutionRecord(engineerExecutionId, {
      metadata: {
        repository: targetRepo.repository,
        pullRequestUrl: pr.html_url,
        pullRequestNumber: pr.number,
      },
    });
  }

  return {
    success: true,
    message:
      `Draft pull request created successfully${pr.html_url ? `: ${pr.html_url}` : "."}`,
    metadata: {
      branchName,
      baseBranch,
      pullRequestUrl: pr.html_url,
      pullRequestNumber: pr.number,
      repository: targetRepo.repository,
    },
  };
}

async function commentOnPullRequest(
  token: string,
  approval: ApprovalRequest,
  targetRepo: GitHubTargetRepository
): Promise<ExecutionResult> {
  const metadata = readApprovalMetadata(approval);
  const pullRequestNumber = readRequiredNumber(metadata, "pullRequestNumber");
  const commentBody = readRequiredString(metadata, "commentBody");

  if (!pullRequestNumber || !commentBody) {
    return {
      success: false,
      message:
        "GitHub pull request comment is missing pullRequestNumber or commentBody in approval metadata.",
    };
  }

  const response = await fetch(githubApiUrl(targetRepo, `issues/${pullRequestNumber}/comments`), {
    method: "POST",
    headers: buildGitHubHeaders(token),
    body: JSON.stringify({
      body: commentBody,
    }),
  });

  if (!response.ok) {
    return buildGitHubFailure("pull request comment", response);
  }

  const comment = (await response.json()) as {
    html_url?: string;
    id?: number;
  };

  return {
    success: true,
    message:
      `Pull request comment created successfully${comment.html_url ? `: ${comment.html_url}` : "."}`,
    metadata: {
      pullRequestNumber,
      commentUrl: comment.html_url,
      commentId: comment.id,
      repository: targetRepo.repository,
    },
  };
}

async function mergePullRequest(
  token: string,
  approval: ApprovalRequest,
  targetRepo: GitHubTargetRepository
): Promise<ExecutionResult> {
  const metadata = readApprovalMetadata(approval);
  const pullRequestNumber = readRequiredNumber(metadata, "pullRequestNumber");
  const mergeMethod = readRequiredString(metadata, "mergeMethod") ?? "squash";
  const commitTitle = readRequiredString(metadata, "commitTitle");

  if (!pullRequestNumber) {
    return {
      success: false,
      message:
        "GitHub pull request merge is missing pullRequestNumber in approval metadata.",
    };
  }

  const response = await fetch(githubApiUrl(targetRepo, `pulls/${pullRequestNumber}/merge`), {
    method: "PUT",
    headers: buildGitHubHeaders(token),
    body: JSON.stringify({
      merge_method: mergeMethod,
      commit_title: commitTitle,
    }),
  });

  if (!response.ok) {
    return buildGitHubFailure("pull request merge", response);
  }

  const payload = (await response.json()) as {
    sha?: string;
    message?: string;
    merged?: boolean;
  };

  return {
    success: Boolean(payload.merged),
    message: payload.message?.trim() || "Pull request merge completed.",
    metadata: {
      pullRequestNumber,
      mergeSha: payload.sha,
      repository: targetRepo.repository,
    },
  };
}

async function resolveGitHubWriteToken(): Promise<string | null> {
  const tokenVaultToken = await getGitHubTokenVaultAccessToken();
  const personalAccessToken = allowGitHubPersonalAccessTokenFallback()
    ? githubEnv.personalAccessToken ?? null
    : null;

  return tokenVaultToken ?? personalAccessToken;
}

async function pushBranch(
  workspaceDir: string,
  branchName: string,
  token: string,
  targetRepo: GitHubTargetRepository
): Promise<void> {
  const remoteUrl = `https://x-access-token:${encodeURIComponent(token)}@github.com/${targetRepo.owner}/${targetRepo.repo}.git`;

  try {
    await execFileAsync(
      "git",
      ["push", "-u", remoteUrl, `HEAD:refs/heads/${branchName}`],
      {
        cwd: workspaceDir,
        timeout: 120_000,
        windowsHide: true,
        maxBuffer: 1024 * 1024 * 8,
      }
    );
  } catch (error) {
    const details = extractExecFailure(error);
    throw new Error(
      `GitHub branch push failed. ${truncateRemoteError(
        [details.stdout.trim(), details.stderr.trim()].filter(Boolean).join("\n")
      )}`
    );
  }
}

function buildIssueBody(approval: ApprovalRequest): string {
  return [
    approval.description,
    "",
    "---",
    "Created by Authrix after approval.",
    `Source agent: ${approval.sourceAgent}`,
    `Risk level: ${approval.riskLevel}`,
    `Approval id: ${approval.id}`,
  ].join("\n");
}

function buildGitHubHeaders(token: string): Record<string, string> {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "authrix-mvp",
    "Content-Type": "application/json; charset=utf-8",
  };
}

function githubApiUrl(targetRepo: GitHubTargetRepository, pathSuffix: string): string {
  return `https://api.github.com/repos/${targetRepo.owner}/${targetRepo.repo}/${pathSuffix}`;
}

async function buildGitHubFailure(
  action: string,
  response: Response
): Promise<ExecutionResult> {
  const text = truncateRemoteError(await response.text());
  return {
    success: false,
    message: `GitHub ${action} failed with ${response.status}. ${text}`.trim(),
  };
}

function readApprovalMetadata(approval: ApprovalRequest): Record<string, unknown> {
  return approval.metadata ?? {};
}

function readRequiredString(
  metadata: Record<string, unknown>,
  key: string
): string | undefined {
  const value = metadata[key];
  return typeof value === "string" && value.trim() ? value.trim() : undefined;
}

function readRequiredNumber(
  metadata: Record<string, unknown>,
  key: string
): number | undefined {
  const value = metadata[key];
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return undefined;
}

function extractExecFailure(error: unknown): {
  stdout: string;
  stderr: string;
} {
  if (typeof error === "object" && error !== null) {
    const maybe = error as {
      stdout?: string | Buffer;
      stderr?: string | Buffer;
    };

    return {
      stdout: typeof maybe.stdout === "string" ? maybe.stdout : String(maybe.stdout ?? ""),
      stderr: typeof maybe.stderr === "string" ? maybe.stderr : String(maybe.stderr ?? ""),
    };
  }

  return {
    stdout: "",
    stderr: String(error),
  };
}

function truncateRemoteError(value: string): string {
  return value.length > 500 ? `${value.slice(0, 497)}...` : value;
}

function resolveGitHubTargetRepository(
  approval: ApprovalRequest
): GitHubTargetRepository | null {
  const metadataRepository = readRequiredString(readApprovalMetadata(approval), "repository");
  const candidate = metadataRepository ?? getConfiguredRepository();

  if (!candidate) {
    return null;
  }

  return parseGitHubRepository(candidate);
}

function getConfiguredRepository(): string | null {
  const owner = githubEnv.owner?.trim();
  const repo = githubEnv.repo?.trim();

  return owner && repo ? `${owner}/${repo}` : null;
}

function parseGitHubRepository(value: string): GitHubTargetRepository | null {
  const trimmed = value
    .trim()
    .replace(/^https?:\/\/github\.com\//i, "")
    .replace(/\.git$/i, "");
  const segments = trimmed.split("/").filter(Boolean);

  if (segments.length >= 2) {
    const owner = segments[segments.length - 2];
    const repo = segments[segments.length - 1];
    return {
      owner,
      repo,
      repository: `${owner}/${repo}`,
    };
  }

  if (segments.length === 1 && githubEnv.owner?.trim()) {
    return {
      owner: githubEnv.owner.trim(),
      repo: segments[0],
      repository: `${githubEnv.owner.trim()}/${segments[0]}`,
    };
  }

  return null;
}
