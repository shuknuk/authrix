import {
  getGitHubConnectionName,
  getGitHubConnectionScopes,
  getGitHubTokenVaultAccessToken,
  isTokenVaultConfigured,
} from "@/lib/auth/token-vault";
import { isAuthConfigured } from "@/lib/auth/auth0";
import { mockGitHubEvents } from "@/lib/mock/github-activity";
import type { GitHubEvent, IntegrationStatus } from "@/types/domain";

const githubEnv = {
  owner: process.env.GITHUB_OWNER,
  repo: process.env.GITHUB_REPO,
  personalAccessToken: process.env.GITHUB_PERSONAL_ACCESS_TOKEN,
} as const;

export interface GitHubIngestionResult {
  events: GitHubEvent[];
  integration: IntegrationStatus;
  repository?: string;
  error?: string;
}

interface RepoRef {
  owner: string;
  repo: string;
}

interface GitHubListPullRequest {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  state: string;
  updated_at: string;
  user?: { login?: string | null } | null;
}

interface GitHubIssue {
  number: number;
  title: string;
  body: string | null;
  html_url: string;
  state: string;
  updated_at: string;
  user?: { login?: string | null } | null;
  pull_request?: unknown;
  labels?: Array<{ name?: string | null }>;
}

interface GitHubCommit {
  sha: string;
  html_url: string;
  commit: {
    message: string;
    author?: {
      name?: string | null;
      date?: string | null;
    } | null;
  };
  author?: { login?: string | null } | null;
}

interface GitHubRelease {
  id: number;
  tag_name: string;
  name: string | null;
  body: string | null;
  html_url: string;
  published_at: string | null;
  prerelease: boolean;
  author?: { login?: string | null } | null;
}

export async function getGitHubIngestionResult(): Promise<GitHubIngestionResult> {
  const repoRef = getRepoRef();
  if (!repoRef) {
    return createMockResult(
      "GitHub repository is not configured yet. Using the bundled engineering activity dataset."
    );
  }

  const tokenVaultToken = await getGitHubTokenVaultAccessToken();
  const accessToken = tokenVaultToken ?? githubEnv.personalAccessToken ?? null;
  const mode = tokenVaultToken
    ? "token-vault"
    : accessToken
      ? "live"
      : "live";
  const usingPublicRead = !tokenVaultToken && !githubEnv.personalAccessToken;

  try {
    const events = await fetchRecentGitHubEvents(repoRef, accessToken);
    return {
      events: events.length > 0 ? events : mockGitHubEvents,
      repository: `${repoRef.owner}/${repoRef.repo}`,
      integration: {
        service: "GitHub",
        connected: true,
        connectedAt: new Date().toISOString(),
        scopes: buildGitHubScopes(mode, accessToken),
        status: "active",
        mode,
        description:
          tokenVaultToken && events.length > 0
            ? `Delegated GitHub access is active through Auth0 Token Vault for ${repoRef.owner}/${repoRef.repo}.`
            : usingPublicRead && isTokenVaultConfigured && events.length > 0
              ? `GitHub activity is live for ${repoRef.owner}/${repoRef.repo}, but no delegated Token Vault account is linked yet.`
              : usingPublicRead && events.length > 0
                ? `Live public GitHub activity is being read from ${repoRef.owner}/${repoRef.repo}.`
                : events.length > 0
                  ? `Live engineering activity is being read from ${repoRef.owner}/${repoRef.repo}.`
                  : `GitHub responded without recent activity, so Authrix kept the demo dataset available for the dashboard.`,
        lastSyncedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    return createMockResult(
      `GitHub sync failed, so Authrix fell back to mock activity. ${toErrorMessage(
        error
      )}`,
      "error"
    );
  }
}

function createMockResult(
  description: string,
  status: IntegrationStatus["status"] = "inactive"
): GitHubIngestionResult {
  return {
    events: mockGitHubEvents,
    integration: {
      service: "GitHub",
      connected: false,
      scopes: ["mock-data"],
      status,
      mode: "mock",
      description,
      lastSyncedAt: new Date().toISOString(),
    },
  };
}

async function fetchRecentGitHubEvents(
  repoRef: RepoRef,
  accessToken: string | null
): Promise<GitHubEvent[]> {
  const [pullRequests, issues, commits, releases] = await Promise.all([
    fetchGitHubJson<GitHubListPullRequest[]>(
      `/repos/${repoRef.owner}/${repoRef.repo}/pulls?state=all&per_page=4&sort=updated&direction=desc`,
      accessToken
    ),
    fetchGitHubJson<GitHubIssue[]>(
      `/repos/${repoRef.owner}/${repoRef.repo}/issues?state=all&per_page=4&sort=updated&direction=desc`,
      accessToken
    ),
    fetchGitHubJson<GitHubCommit[]>(
      `/repos/${repoRef.owner}/${repoRef.repo}/commits?per_page=4`,
      accessToken
    ),
    fetchGitHubJson<GitHubRelease[]>(
      `/repos/${repoRef.owner}/${repoRef.repo}/releases?per_page=2`,
      accessToken
    ),
  ]);

  const events: GitHubEvent[] = [
    ...pullRequests.map((pullRequest) => ({
      id: `gh-live-pr-${pullRequest.number}`,
      type: "pull_request" as const,
      repo: `${repoRef.owner}/${repoRef.repo}`,
      author: pullRequest.user?.login ?? "unknown",
      title: pullRequest.title,
      description: summarizeText(pullRequest.body, "Pull request updated."),
      url: pullRequest.html_url,
      timestamp: pullRequest.updated_at,
      metadata: {
        state: pullRequest.state,
      },
    })),
    ...issues
      .filter((issue) => !issue.pull_request)
      .map((issue) => ({
        id: `gh-live-issue-${issue.number}`,
        type: "issue" as const,
        repo: `${repoRef.owner}/${repoRef.repo}`,
        author: issue.user?.login ?? "unknown",
        title: issue.title,
        description: summarizeText(issue.body, "Issue updated."),
        url: issue.html_url,
        timestamp: issue.updated_at,
        metadata: {
          state: issue.state,
          labels: (issue.labels ?? [])
            .map((label) => label.name)
            .filter(Boolean),
        },
      })),
    ...commits.map((commit) => ({
      id: `gh-live-commit-${commit.sha}`,
      type: "push" as const,
      repo: `${repoRef.owner}/${repoRef.repo}`,
      author: commit.author?.login ?? commit.commit.author?.name ?? "unknown",
      title: firstLine(commit.commit.message),
      description: summarizeText(
        commit.commit.message,
        "Commit pushed to the repository."
      ),
      url: commit.html_url,
      timestamp:
        commit.commit.author?.date ?? new Date().toISOString(),
      metadata: {
        sha: commit.sha,
      },
    })),
    ...releases.map((release) => ({
      id: `gh-live-release-${release.id}`,
      type: "release" as const,
      repo: `${repoRef.owner}/${repoRef.repo}`,
      author: release.author?.login ?? "unknown",
      title: release.name ?? release.tag_name,
      description: summarizeText(
        release.body,
        `Release ${release.tag_name} published.`
      ),
      url: release.html_url,
      timestamp: release.published_at ?? new Date().toISOString(),
      metadata: {
        prerelease: release.prerelease,
        tag: release.tag_name,
      },
    })),
  ];

  return events.sort(
    (left, right) =>
      new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime()
  );
}

async function fetchGitHubJson<T>(
  path: string,
  accessToken: string | null
): Promise<T> {
  const response = await fetch(`https://api.github.com${path}`, {
    headers: {
      Accept: "application/vnd.github+json",
      ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "authrix-mvp",
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error(`GitHub API returned ${response.status} for ${path}.`);
  }

  return (await response.json()) as T;
}

function buildGitHubScopes(
  mode: IntegrationStatus["mode"],
  accessToken: string | null
): string[] {
  if (mode === "token-vault") {
    return [
      `connection:${getGitHubConnectionName() ?? "github"}`,
      ...getGitHubConnectionScopes(),
    ];
  }

  if (accessToken) {
    return ["repo", "read:org"];
  }

  return ["public-read"];
}

function getRepoRef(): RepoRef | null {
  if (!githubEnv.owner || !githubEnv.repo) {
    return null;
  }

  return {
    owner: githubEnv.owner,
    repo: githubEnv.repo,
  };
}

function summarizeText(value: string | null | undefined, fallback: string): string {
  if (!value) {
    return fallback;
  }

  const line = firstLine(value);
  return line.length > 180 ? `${line.slice(0, 177)}...` : line;
}

function firstLine(value: string): string {
  return value.split("\n")[0]?.trim() || value.trim();
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown GitHub error.";
}

export function getAuth0IntegrationStatus(): IntegrationStatus {
  return {
    service: "Auth0",
    connected: isAuthConfigured,
    connectedAt: isAuthConfigured ? new Date().toISOString() : undefined,
    scopes: isTokenVaultConfigured
      ? ["openid", "profile", "email", "token-vault"]
      : ["openid", "profile", "email"],
    status: isAuthConfigured ? "active" : "inactive",
    mode: isTokenVaultConfigured ? "token-vault" : "live",
    description: !isAuthConfigured
      ? "Auth0 is not configured in the local environment yet."
      : isTokenVaultConfigured
        ? "Authrix login is active and the GitHub connected-account flow is available through /auth/connect."
        : "Authrix login is active. Token Vault connection flow still needs to be completed.",
    lastSyncedAt: new Date().toISOString(),
  };
}
