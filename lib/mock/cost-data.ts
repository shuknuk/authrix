import type { CostBreakdownItem, CostAnomaly } from "@/types/domain";

export const mockCostBreakdown: CostBreakdownItem[] = [
  { service: "Vercel", amount: 42.0, change: 12.5, trend: "up" },
  { service: "Supabase", amount: 25.0, change: -3.2, trend: "down" },
  { service: "OpenAI API", amount: 78.5, change: 45.0, trend: "up" },
  { service: "GitHub Actions", amount: 15.0, change: 0.0, trend: "stable" },
  { service: "AWS S3", amount: 8.3, change: 5.1, trend: "up" },
];

export const mockCostAnomalies: CostAnomaly[] = [
  {
    service: "OpenAI API",
    description:
      "45% spend increase over previous week. Correlates with increased agent testing during approval engine development.",
    severity: "medium",
    detectedAt: "2026-03-26T08:00:00Z",
  },
  {
    service: "Vercel",
    description:
      "Build minutes trending upward. Multiple preview deployments from open PRs.",
    severity: "low",
    detectedAt: "2026-03-27T10:00:00Z",
  },
];

export const mockCostTotals = {
  totalSpend: 168.8,
  currency: "USD",
  period: {
    start: "2026-03-21T00:00:00Z",
    end: "2026-03-28T00:00:00Z",
  },
};
