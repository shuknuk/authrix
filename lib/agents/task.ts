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
  return summary.highlights
    .filter((h) => h.impact === "high")
    .map((h, i) => ({
      id: `task_highlight_${Date.now()}_${i}`,
      title: `Review: ${h.title}`,
      description: `High-impact change requires review. ${h.description}`,
      priority: "high" as TaskPriority,
      source: `Engineering summary highlight`,
      sourceAgentId: "task",
      status: "suggested" as const,
      createdAt: new Date().toISOString(),
    }));
}

function tasksFromRiskFlags(summary: EngineeringSummary): SuggestedTask[] {
  return summary.riskFlags.map((flag, i) => ({
    id: `task_risk_${Date.now()}_${i}`,
    title: `Address: ${flag.title}`,
    description: flag.description,
    priority: riskToPriority(flag.severity),
    source: `Engineering summary risk flag`,
    sourceAgentId: "task",
    status: "suggested" as const,
    createdAt: new Date().toISOString(),
  }));
}

function tasksFromRepoActivity(summary: EngineeringSummary): SuggestedTask[] {
  const tasks: SuggestedTask[] = [];

  for (const repo of summary.repoBreakdown) {
    if (repo.prCount > 0 && repo.issueCount === 0) {
      tasks.push({
        id: `task_repo_${Date.now()}_${repo.repo}`,
        title: `Triage open work in ${repo.repo}`,
        description: `${repo.prCount} PRs merged but no issues tracked. Consider reviewing for undocumented work.`,
        priority: "low",
        source: `Repo activity analysis`,
        sourceAgentId: "task",
        status: "suggested",
        createdAt: new Date().toISOString(),
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
