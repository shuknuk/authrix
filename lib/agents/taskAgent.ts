import type { SuggestedTask, WeeklySummary } from "@/types/authrix";

export function taskAgent(summary: WeeklySummary): SuggestedTask[] {
  const primaryFocus = summary.focusAreas[0] ?? "authrix/web";

  return [
    {
      id: "task-1",
      title: `Tighten approval messaging for ${primaryFocus}`,
      description:
        "Refine the action copy and payload preview so users understand exactly what will execute before they approve it.",
      priority: "high",
      owner: "Product + frontend",
      rationale: summary.risks[0] ?? "Approval clarity is central to the demo.",
      approvalRequired: true,
    },
    {
      id: "task-2",
      title: "Validate GitHub fallback behavior",
      description:
        "Exercise the disconnected, sparse-activity, and reconnected cases to prove the dashboard remains stable and believable.",
      priority: "medium",
      owner: "Platform",
      rationale:
        "The task agent only sees the summary output and is prioritizing demo resilience.",
      approvalRequired: true,
    },
    {
      id: "task-3",
      title: `Prepare demo talking points for ${primaryFocus}`,
      description:
        "Convert the strongest accomplishments and risks into presenter notes for the weekly summary and cost cards.",
      priority: "low",
      owner: "Founder",
      rationale: "A focused demo narrative increases confidence in the MVP.",
      approvalRequired: true,
    },
  ];
}
