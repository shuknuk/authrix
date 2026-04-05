import type { GitHubEvent, EngineeringActivity } from "@/types/domain";

export const mockGitHubEvents: GitHubEvent[] = [
  {
    id: "gh-001",
    type: "pull_request",
    repo: "authrix/platform",
    author: "kinshuk",
    title: "Add approval engine backend",
    description:
      "Implements the core approval engine with risk classification and audit logging.",
    url: "https://github.com/authrix/platform/pull/42",
    timestamp: "2026-03-24T14:30:00Z",
    metadata: { state: "merged", additions: 420, deletions: 35 },
  },
  {
    id: "gh-002",
    type: "push",
    repo: "authrix/platform",
    author: "soham",
    title: "Refactor agent runtime bridge interface",
    description:
      "Cleans up the runtime bridge types and adds session management methods.",
    url: "https://github.com/authrix/platform/commit/abc123",
    timestamp: "2026-03-24T16:45:00Z",
    metadata: { branch: "dev", commits: 3 },
  },
  {
    id: "gh-003",
    type: "pull_request",
    repo: "authrix/platform",
    author: "kinshuk",
    title: "Wire GitHub ingestion pipeline",
    description:
      "Connects the GitHub API adapter to the normalization layer. Events are now stored as EngineeringActivity records.",
    url: "https://github.com/authrix/platform/pull/43",
    timestamp: "2026-03-25T09:15:00Z",
    metadata: { state: "merged", additions: 280, deletions: 12 },
  },
  {
    id: "gh-004",
    type: "issue",
    repo: "authrix/platform",
    author: "soham",
    title: "Cost anomaly detection is too aggressive",
    description:
      "The devops agent flags normal weekend traffic dips as anomalies. Need to adjust sensitivity thresholds.",
    url: "https://github.com/authrix/platform/issues/44",
    timestamp: "2026-03-25T11:00:00Z",
    metadata: { labels: ["bug", "agent:devops"] },
  },
  {
    id: "gh-005",
    type: "pull_request",
    repo: "authrix/docs",
    author: "kinshuk",
    title: "Update security architecture docs",
    description:
      "Adds the mediated execution model and token vault integration docs.",
    url: "https://github.com/authrix/docs/pull/12",
    timestamp: "2026-03-25T14:20:00Z",
    metadata: { state: "merged", additions: 150, deletions: 30 },
  },
  {
    id: "gh-006",
    type: "review",
    repo: "authrix/platform",
    author: "soham",
    title: "Review: Add approval engine backend",
    description: "Approved with minor suggestions on error handling patterns.",
    url: "https://github.com/authrix/platform/pull/42#pullrequestreview-1",
    timestamp: "2026-03-24T15:30:00Z",
    metadata: { state: "approved" },
  },
  {
    id: "gh-007",
    type: "push",
    repo: "authrix/platform",
    author: "soham",
    title: "Fix timeline entry deduplication",
    description:
      "Resolves duplicate entries appearing when the same event is ingested from multiple sources.",
    url: "https://github.com/authrix/platform/commit/def456",
    timestamp: "2026-03-26T10:00:00Z",
    metadata: { branch: "dev", commits: 1 },
  },
  {
    id: "gh-008",
    type: "pull_request",
    repo: "authrix/platform",
    author: "kinshuk",
    title: "Add cost breakdown by service",
    description:
      "Finance/Ops agent now produces per-service cost breakdowns with trend indicators.",
    url: "https://github.com/authrix/platform/pull/45",
    timestamp: "2026-03-26T13:00:00Z",
    metadata: { state: "open", additions: 190, deletions: 20 },
  },
  {
    id: "gh-009",
    type: "release",
    repo: "authrix/platform",
    author: "kinshuk",
    title: "v0.1.0-alpha",
    description:
      "First internal alpha with dashboard shell, mock agents, and approval flow.",
    url: "https://github.com/authrix/platform/releases/tag/v0.1.0-alpha",
    timestamp: "2026-03-27T18:00:00Z",
    metadata: { prerelease: true },
  },
  {
    id: "gh-010",
    type: "push",
    repo: "authrix/platform",
    author: "soham",
    title: "Add structured audit logging",
    description:
      "All approval decisions and agent executions now produce audit events with full context.",
    url: "https://github.com/authrix/platform/commit/ghi789",
    timestamp: "2026-03-27T20:00:00Z",
    metadata: { branch: "dev", commits: 2 },
  },
];

export function normalizeGitHubEvents(
  events: GitHubEvent[]
): EngineeringActivity[] {
  return events.map((event) => ({
    id: `activity-${event.id}`,
    source: "github" as const,
    eventType: event.type,
    repo: event.repo,
    author: event.author,
    title: event.title,
    summary: event.description,
    impact: inferImpact(event),
    timestamp: event.timestamp,
    rawEventId: event.id,
  }));
}

function inferImpact(event: GitHubEvent): "low" | "medium" | "high" {
  if (event.type === "release") return "high";
  if (event.type === "pull_request") {
    const additions = (event.metadata.additions as number) ?? 0;
    if (additions > 300) return "high";
    if (additions > 100) return "medium";
  }
  if (event.type === "issue") {
    const labels = (event.metadata.labels as string[]) ?? [];
    if (labels.includes("bug")) return "medium";
  }
  return "low";
}
