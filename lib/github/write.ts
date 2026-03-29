import { getGitHubTokenVaultAccessToken } from "@/lib/auth/token-vault";
import type { ApprovalRequest } from "@/types/domain";

interface ExecutionResult {
  success: boolean;
  message: string;
  metadata?: Record<string, unknown>;
}

const githubEnv = {
  owner: process.env.GITHUB_OWNER,
  repo: process.env.GITHUB_REPO,
  personalAccessToken: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
} as const;

export async function executeGitHubApprovalAction(
  approval: ApprovalRequest
): Promise<ExecutionResult> {
  if (approval.actionKind !== "github.issue.create") {
    return {
      success: false,
      message: `No GitHub execution adapter is registered for "${approval.actionKind}".`,
    };
  }

  if (!githubEnv.owner || !githubEnv.repo) {
    return {
      success: false,
      message:
        "GitHub write execution is not configured because GITHUB_OWNER or GITHUB_REPO is missing.",
    };
  }

  const token =
    (await getGitHubTokenVaultAccessToken()) ?? githubEnv.personalAccessToken ?? null;

  if (!token) {
    return {
      success: false,
      message:
        "GitHub write execution requires a Token Vault GitHub connection or a configured personal access token.",
    };
  }

  const response = await fetch(
    `https://api.github.com/repos/${githubEnv.owner}/${githubEnv.repo}/issues`,
    {
      method: "POST",
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: `Bearer ${token}`,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "authrix-mvp",
      },
      body: JSON.stringify({
        title: approval.title,
        body: buildIssueBody(approval),
      }),
    }
  );

  if (!response.ok) {
    const text = await response.text();
    return {
      success: false,
      message: `GitHub issue creation failed with ${response.status}. ${text}`.trim(),
    };
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
      repository: `${githubEnv.owner}/${githubEnv.repo}`,
    },
  };
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
