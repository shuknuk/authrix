export interface MockUsageCostInput {
  window: string;
  currentSpendUsd: number;
  budgetUsd: number;
  burnMultiple: number;
  flaggedServices: string[];
  anomalyCount: number;
}

// Mock cost input keeps the DevOps card stable until a real spend provider is added.
export function getMockUsageCostInput(): MockUsageCostInput {
  return {
    window: "Last 7 days",
    currentSpendUsd: 842,
    budgetUsd: 1200,
    burnMultiple: 1.26,
    flaggedServices: ["OpenAI Responses API", "Vercel preview builds"],
    anomalyCount: 2,
  };
}
