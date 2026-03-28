import type { EngineerAgentInput, EngineerAgentOutput } from "@/types/agents";
import type {
  EngineeringActivity,
  SummaryHighlight,
  RepoSummary,
  ContributorSummary,
  RiskFlag,
} from "@/types/domain";

/**
 * Engineer agent: takes normalized engineering activity and produces a
 * structured weekly summary. MVP uses deterministic logic; will be backed
 * by LLM through the runtime bridge later.
 */
export function engineerAgent(input: EngineerAgentInput): EngineerAgentOutput {
  const { activities, period } = input;

  const repoBreakdown = buildRepoBreakdown(activities);
  const contributorBreakdown = buildContributorBreakdown(activities);
  const highlights = extractHighlights(activities);
  const riskFlags = extractRiskFlags(activities);

  const overallSummary = generateOverallSummary(
    activities,
    repoBreakdown,
    highlights
  );

  return {
    summary: {
      id: `summary_${Date.now()}`,
      period,
      generatedAt: new Date().toISOString(),
      overallSummary,
      highlights,
      repoBreakdown,
      contributorBreakdown,
      riskFlags,
      activityCount: activities.length,
    },
  };
}

function buildRepoBreakdown(activities: EngineeringActivity[]): RepoSummary[] {
  const byRepo = new Map<string, EngineeringActivity[]>();
  for (const a of activities) {
    const list = byRepo.get(a.repo) ?? [];
    list.push(a);
    byRepo.set(a.repo, list);
  }

  return Array.from(byRepo.entries()).map(([repo, acts]) => ({
    repo,
    commitCount: acts.filter((a) => a.eventType === "push").length,
    prCount: acts.filter((a) => a.eventType === "pull_request").length,
    issueCount: acts.filter((a) => a.eventType === "issue").length,
    summary: `${acts.length} events across ${new Set(acts.map((a) => a.author)).size} contributors`,
  }));
}

function buildContributorBreakdown(
  activities: EngineeringActivity[]
): ContributorSummary[] {
  const byAuthor = new Map<string, EngineeringActivity[]>();
  for (const a of activities) {
    const list = byAuthor.get(a.author) ?? [];
    list.push(a);
    byAuthor.set(a.author, list);
  }

  return Array.from(byAuthor.entries()).map(([author, acts]) => ({
    author,
    commitCount: acts.filter((a) => a.eventType === "push").length,
    prCount: acts.filter((a) => a.eventType === "pull_request").length,
    topRepos: [...new Set(acts.map((a) => a.repo))],
  }));
}

function extractHighlights(
  activities: EngineeringActivity[]
): SummaryHighlight[] {
  return activities
    .filter((a) => a.impact === "high" || a.impact === "medium")
    .map((a) => ({
      title: a.title,
      description: a.summary,
      impact: a.impact,
      relatedActivityIds: [a.id],
    }));
}

function extractRiskFlags(activities: EngineeringActivity[]): RiskFlag[] {
  const flags: RiskFlag[] = [];

  const highImpact = activities.filter((a) => a.impact === "high");
  if (highImpact.length > 3) {
    flags.push({
      title: "High volume of high-impact changes",
      description: `${highImpact.length} high-impact events this period. Review for unintended architectural drift.`,
      severity: "medium",
      relatedActivityIds: highImpact.map((a) => a.id),
    });
  }

  const bugs = activities.filter(
    (a) => a.eventType === "issue" && a.summary.toLowerCase().includes("bug")
  );
  if (bugs.length > 0) {
    flags.push({
      title: "Open bugs reported",
      description: `${bugs.length} bug-related issues opened this period.`,
      severity: bugs.length > 2 ? "high" : "low",
      relatedActivityIds: bugs.map((a) => a.id),
    });
  }

  return flags;
}

function generateOverallSummary(
  activities: EngineeringActivity[],
  repos: RepoSummary[],
  highlights: SummaryHighlight[]
): string {
  const authors = new Set(activities.map((a) => a.author)).size;
  const repoCount = repos.length;
  const highImpact = highlights.filter((h) => h.impact === "high").length;

  return (
    `This week saw ${activities.length} engineering events across ${repoCount} ` +
    `repositories from ${authors} contributors. ` +
    (highImpact > 0
      ? `${highImpact} high-impact changes were recorded. `
      : "") +
    `Key areas of activity: ${repos.map((r) => r.repo).join(", ")}.`
  );
}
