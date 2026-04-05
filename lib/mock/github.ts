import type { ConnectionStatus, NormalizedGitHubActivity } from "@/types/authrix";

// Mock fallback keeps the demo reliable when GitHub is disconnected or has sparse live activity.
export function getMockGitHubActivity(): NormalizedGitHubActivity[] {
  return [
    {
      id: "mock-pr-1",
      kind: "pull_request",
      title: "Ship approval modal for task creation flow",
      summary: "Merged a guarded approval flow before write actions.",
      repo: "authrix/web",
      actor: "maya",
      occurredAt: "2026-03-26T15:22:00.000Z",
      url: "https://github.com/shuknuk/authrix/pull/18",
      status: "merged",
      source: "mock",
    },
    {
      id: "mock-commit-1",
      kind: "commit",
      title: "Normalize GitHub events into typed agent input",
      summary: "Converted raw events into a stable normalized activity model.",
      repo: "authrix/web",
      actor: "maya",
      occurredAt: "2026-03-25T12:10:00.000Z",
      url: "https://github.com/shuknuk/authrix/commit/abc123",
      branch: "feat/github-summary-pipeline",
      source: "mock",
    },
    {
      id: "mock-review-1",
      kind: "review",
      title: "Review requested on Auth0 route protection",
      summary: "Security review flagged callback coverage and logout path checks.",
      repo: "authrix/web",
      actor: "jules",
      occurredAt: "2026-03-24T18:41:00.000Z",
      url: "https://github.com/shuknuk/authrix/pull/17#pullrequestreview-1",
      status: "commented",
      source: "mock",
    },
    {
      id: "mock-issue-1",
      kind: "issue",
      title: "Close dashboard empty-state bug for disconnected accounts",
      summary: "Resolved an issue where cards collapsed when no live connection existed.",
      repo: "authrix/web",
      actor: "maya",
      occurredAt: "2026-03-24T10:03:00.000Z",
      url: "https://github.com/shuknuk/authrix/issues/14",
      status: "closed",
      source: "mock",
    },
    {
      id: "mock-branch-1",
      kind: "branch",
      title: "Create feat/cost-risk-card branch",
      summary: "Started the cost and risk visibility slice for the MVP demo.",
      repo: "authrix/web",
      actor: "maya",
      occurredAt: "2026-03-23T20:17:00.000Z",
      branch: "feat/cost-risk-card",
      source: "mock",
    },
    {
      id: "mock-release-1",
      kind: "release",
      title: "Cut demo candidate release",
      summary: "Prepared a stable handoff build for the internal demo walkthrough.",
      repo: "authrix/web",
      actor: "maya",
      occurredAt: "2026-03-22T16:44:00.000Z",
      url: "https://github.com/shuknuk/authrix/releases/tag/demo-candidate",
      status: "published",
      source: "mock",
    },
  ];
}

export function getMockConnectionStatus(): ConnectionStatus {
  return {
    provider: "github",
    connected: false,
    source: "mock",
    message:
      "GitHub is not connected yet. Authrix is using a clearly labeled mock feed so the demo stays reliable.",
  };
}
