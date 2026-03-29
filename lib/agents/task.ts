import type { TaskAgentInput, TaskAgentOutput } from "@/types/agents";
import type { EngineeringSummary, SuggestedTask, TaskPriority } from "@/types/domain";

/**
 * Task agent: takes an engineering summary and generates follow-up tasks.
 * MVP uses deterministic extraction; will be backed by LLM later.
 */
export function taskAgent(input: TaskAgentInput): TaskAgentOutput {
  const { summary } = input;

  const tasks: SuggestedTask[] = [
    ...tasksFromHighlights(summary),
    ...tasksFromRiskFlags(summary),
    ...tasksFromRepoActivity(summary),
  ];

  return { tasks };
}

function tasksFromHighlights(summary: EngineeringSummary): SuggestedTask[] {
  const defaultOwner = getDefaultOwner(summary);

  return summary.highlights
    .filter((h) => h.impact === "high")
    .map((h, i) => ({
      id: `task-highlight-${toSlug(h.title)}-${i + 1}`,
      title: `Review: ${h.title}`,
      description: `High-impact change requires review. ${h.description}`,
      priority: "high" as TaskPriority,
      suggestedOwner: defaultOwner,
      source: `Engineering summary highlight`,
      sourceAgentId: "task",
      status: "suggested" as const,
      createdAt: summary.generatedAt,
    }));
}

function tasksFromRiskFlags(summary: EngineeringSummary): SuggestedTask[] {
  const defaultOwner = getDefaultOwner(summary);

  return summary.riskFlags.map((flag, i) => ({
    id: `task-risk-${toSlug(flag.title)}-${i + 1}`,
    title: `Address: ${flag.title}`,
    description: flag.description,
    priority: riskToPriority(flag.severity),
    suggestedOwner: defaultOwner,
    source: `Engineering summary risk flag`,
    sourceAgentId: "task",
    status: "suggested" as const,
    createdAt: summary.generatedAt,
  }));
}

function tasksFromRepoActivity(summary: EngineeringSummary): SuggestedTask[] {
  const tasks: SuggestedTask[] = [];

  for (const repo of summary.repoBreakdown) {
    if (repo.prCount > 0 && repo.issueCount === 0) {
      const repoOwner =
        summary.contributorBreakdown.find((contributor) =>
          contributor.topRepos.includes(repo.repo)
        )?.author ?? getDefaultOwner(summary);

      tasks.push({
        id: `task-repo-${toSlug(repo.repo)}`,
        title: `Triage open work in ${repo.repo}`,
        description: `${repo.prCount} PRs merged but no issues tracked. Consider reviewing for undocumented work.`,
        priority: "low",
        suggestedOwner: repoOwner,
        source: `Repo activity analysis`,
        sourceAgentId: "task",
        status: "suggested",
        createdAt: summary.generatedAt,
      });
    }
  }

  return tasks;
}

function riskToPriority(severity: string): TaskPriority {
  switch (severity) {
    case "high":
      return "critical";
    case "medium":
      return "high";
    default:
      return "medium";
  }
}

function getDefaultOwner(summary: EngineeringSummary): string | undefined {
  return summary.contributorBreakdown[0]?.author;
}

function toSlug(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
}
