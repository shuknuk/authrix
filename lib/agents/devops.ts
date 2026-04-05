import type { DevOpsAgentInput, DevOpsAgentOutput } from "@/types/agents";
import type { RiskLevel } from "@/types/domain";

/**
 * Finance/Ops agent: takes cost and usage data and produces a spend report with
 * risk assessment. MVP uses deterministic logic; will be backed by LLM later.
 */
export function devopsAgent(input: DevOpsAgentInput): DevOpsAgentOutput {
  const { costBreakdown, anomalies, period, totalSpend, currency } = input;

  const riskLevel = assessRisk(anomalies, costBreakdown);
  const summary = generateCostSummary(
    totalSpend,
    currency,
    costBreakdown,
    anomalies,
    riskLevel
  );

  return {
    report: {
      id: `cost_${Date.now()}`,
      period,
      generatedAt: new Date().toISOString(),
      totalSpend,
      currency,
      breakdown: costBreakdown,
      anomalies,
      riskLevel,
      summary,
    },
  };
}

function assessRisk(
  anomalies: { severity: string }[],
  breakdown: { change: number }[]
): RiskLevel {
  const hasHighAnomaly = anomalies.some((a) => a.severity === "high");
  if (hasHighAnomaly) return "high";

  const hasMediumAnomaly = anomalies.some((a) => a.severity === "medium");
  const bigSpike = breakdown.some((b) => Math.abs(b.change) > 30);
  if (hasMediumAnomaly || bigSpike) return "medium";

  return "low";
}

function generateCostSummary(
  totalSpend: number,
  currency: string,
  breakdown: { service: string; change: number; trend: string }[],
  anomalies: { service: string }[],
  riskLevel: RiskLevel
): string {
  const trending = breakdown.filter((b) => b.trend === "up");
  const trendingNames = trending.map((b) => b.service).join(", ");

  let summary = `Total tracked spend this period: ${currency} ${totalSpend.toFixed(2)}. `;

  if (trending.length > 0) {
    summary += `Spend is trending up for: ${trendingNames}. `;
  }

  if (anomalies.length > 0) {
    summary += `${anomalies.length} anomaly(s) detected. `;
  }

  summary += `Overall risk level: ${riskLevel}.`;

  return summary;
}
