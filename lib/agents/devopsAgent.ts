import type { CostRiskInsight } from "@/types/authrix";
import type { MockUsageCostInput } from "@/lib/mock/costs";

export function devopsAgent(input: MockUsageCostInput): CostRiskInsight {
  const budgetStatus: CostRiskInsight["budgetStatus"] =
    input.currentSpendUsd / input.budgetUsd > 0.85
      ? "at_risk"
      : input.currentSpendUsd / input.budgetUsd > 0.65
        ? "watch"
        : "on_track";

  return {
    spendUsd: `$${input.currentSpendUsd.toLocaleString()}`,
    budgetStatus,
    summary:
      budgetStatus === "on_track"
        ? "API spend is healthy for the current week, but preview environments are worth monitoring."
        : budgetStatus === "watch"
          ? "Spend is trending up faster than budget, mostly from AI inference and preview churn."
          : "Spend is near the weekly ceiling and needs containment before the next demo cycle.",
    risks: [
      `${input.flaggedServices[0]} is driving the sharpest spend increase.`,
      `${input.anomalyCount} anomaly signal${
        input.anomalyCount === 1 ? "" : "s"
      } were detected in the current window.`,
    ],
    recommendations: [
      "Cap non-demo preview runs and reuse seeded mock data during product rehearsals.",
      "Audit large LLM requests before enabling any persistent execution path.",
    ],
    window: input.window,
  };
}
