import type { NormalizedGitHubActivity, WeeklySummary } from "@/types/authrix";

export function engineerAgent(
  activities: NormalizedGitHubActivity[],
): WeeklySummary {
  const mergedPullRequests = activities.filter(
    (activity) => activity.kind === "pull_request" && activity.status === "merged",
  ).length;
  const commits = activities.filter((activity) => activity.kind === "commit").length;
  const issuesClosed = activities.filter(
    (activity) => activity.kind === "issue" && activity.status === "closed",
  ).length;
  const activeRepos = new Set(activities.map((activity) => activity.repo)).size;

  const repoCounts = new Map<string, number>();
  for (const activity of activities) {
    repoCounts.set(activity.repo, (repoCounts.get(activity.repo) ?? 0) + 1);
  }

  const focusAreas = [...repoCounts.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([repo]) => repo);

  const accomplishments = activities
    .filter((activity) =>
      ["pull_request", "release", "issue", "commit"].includes(activity.kind),
    )
    .slice(0, 3)
    .map((activity) => activity.title);

  const risks: string[] = [];

  if (mergedPullRequests < 2) {
    risks.push("Merged output is thin, which may hide unfinished work before the demo.");
  }

  if (activeRepos > 3) {
    risks.push("Work is spread across several repos, increasing review and handoff overhead.");
  }

  if (!activities.some((activity) => activity.kind === "review")) {
    risks.push("The feed shows little review activity, so quality gates may be too light.");
  }

  if (risks.length === 0) {
    risks.push("No urgent delivery risks surfaced from the current engineering activity window.");
  }

  const momentum: WeeklySummary["momentum"] =
    mergedPullRequests >= 2 && commits >= 3
      ? "high"
      : mergedPullRequests >= 1 || commits >= 2
        ? "steady"
        : "watch";

  return {
    headline: `Engineering touched ${activeRepos || 1} repo${
      activeRepos === 1 ? "" : "s"
    } with ${mergedPullRequests} merged PR${mergedPullRequests === 1 ? "" : "s"}.`,
    overview:
      "The engineer agent sees concentrated work on approval gating, GitHub normalization, and dashboard readiness. The current week looks demo-oriented, with a bias toward shipping visible product slices quickly.",
    focusAreas:
      focusAreas.length > 0 ? focusAreas : ["authrix/web"],
    accomplishments:
      accomplishments.length > 0
        ? accomplishments
        : ["Set up the initial Authrix dashboard baseline."],
    risks,
    metrics: {
      mergedPullRequests,
      commits,
      issuesClosed,
      activeRepos,
    },
    momentum,
  };
}
