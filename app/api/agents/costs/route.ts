import { NextResponse } from "next/server";
import { devopsAgent } from "@/lib/agents/devops";
import { mockCostBreakdown, mockCostAnomalies, mockCostTotals } from "@/lib/mock/cost-data";

export async function GET() {
  const { report } = devopsAgent({
    costBreakdown: mockCostBreakdown,
    anomalies: mockCostAnomalies,
    period: mockCostTotals.period,
    totalSpend: mockCostTotals.totalSpend,
    currency: mockCostTotals.currency,
  });

  return NextResponse.json(report);
}
