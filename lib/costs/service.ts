import "server-only";
import type { CostReport, CostBreakdownItem, CostAnomaly } from "@/types/domain";
import {
  fetchVercelCostData,
  isVercelConfigured,
  getVercelConnectionStatus,
} from "./providers/vercel";
import {
  fetchOpenAIUsageData,
  isOpenAIConfigured,
  getOpenAIConnectionStatus,
} from "./providers/openai";
import {
  fetchGitHubActionsCost,
  getGitHubActionsConnectionStatus,
} from "./providers/github";
import { getGitHubSession } from "@/lib/github/session";
import {
  mockCostBreakdown,
  mockCostAnomalies,
  mockCostTotals,
} from "@/lib/mock/cost-data";

export interface CostServiceResult {
  report: CostReport;
  sources: {
    vercel: { configured: boolean; live: boolean; message: string };
    openai: { configured: boolean; live: boolean; message: string };
    github: { configured: boolean; live: boolean; message: string };
    mock: boolean;
  };
}

/**
 * Aggregate cost data from all configured providers
 * Falls back to mock data when no live sources are available
 */
export async function getAggregatedCostReport(): Promise<CostServiceResult> {
  const refreshedAt = new Date().toISOString();

  // Check configuration statuses
  const vercelStatus = getVercelConnectionStatus();
  const openaiStatus = getOpenAIConnectionStatus();
  const githubSession = await getGitHubSession();
  const githubStatus = getGitHubActionsConnectionStatus(Boolean(githubSession?.accessToken));

  const result: CostServiceResult = {
    report: {
      id: `cost-report-${refreshedAt}`,
      totalSpend: 0,
      currency: "USD",
      period: {
        start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        end: refreshedAt,
      },
      breakdown: [],
      anomalies: [],
      summary: "",
      generatedAt: refreshedAt,
      riskLevel: "low",
    },
    sources: {
      vercel: {
        configured: vercelStatus.configured,
        live: false,
        message: vercelStatus.message,
      },
      openai: {
        configured: openaiStatus.configured,
        live: false,
        message: openaiStatus.message,
      },
      github: {
        configured: githubStatus.configured,
        live: false,
        message: githubStatus.message,
      },
      mock: false,
    },
  };

  // Try to fetch from each provider
  const breakdownPromises: Promise<CostBreakdownItem[]>[] = [];
  const anomalies: CostAnomaly[] = [];

  // Vercel
  if (isVercelConfigured()) {
    try {
      const vercelData = await fetchVercelCostData();
      if (vercelData) {
        result.sources.vercel.live = true;
        result.sources.vercel.message = "Live Vercel data";
        result.report.totalSpend += vercelData.totalSpend;

        breakdownPromises.push(
          Promise.resolve(
            vercelData.breakdown.map(
              (item): CostBreakdownItem => ({
                service: `Vercel ${item.category}`,
                amount: item.amount,
                change: item.change,
                trend: item.trend,
              })
            )
          )
        );
      }
    } catch (error) {
      console.warn("Failed to fetch Vercel cost data:", error);
    }
  }

  // OpenAI
  if (isOpenAIConfigured()) {
    try {
      const openaiData = await fetchOpenAIUsageData();
      if (openaiData) {
        result.sources.openai.live = true;
        result.sources.openai.message = "Live OpenAI data";
        result.report.totalSpend += openaiData.totalSpend;

        breakdownPromises.push(
          Promise.resolve(
            openaiData.breakdown.map(
              (item): CostBreakdownItem => ({
                service: `OpenAI ${item.model}`,
                amount: item.amount,
                change: item.change,
                trend: item.trend,
              })
            )
          )
        );

        // Add OpenAI anomalies
        for (const anomaly of openaiData.anomalies) {
          anomalies.push({
            service: anomaly.model,
            description: anomaly.description,
            severity: anomaly.severity,
            detectedAt: refreshedAt,
          });
        }
      }
    } catch (error) {
      console.warn("Failed to fetch OpenAI cost data:", error);
    }
  }

  // GitHub Actions
  if (githubSession?.accessToken && githubSession.login) {
    try {
      const githubData = await fetchGitHubActionsCost(
        githubSession.accessToken,
        githubSession.login
      );
      if (githubData) {
        result.sources.github.live = true;
        result.sources.github.message = "Live GitHub Actions data";
        result.report.totalSpend += githubData.totalSpend;

        breakdownPromises.push(
          Promise.resolve(
            githubData.breakdown.map(
              (item): CostBreakdownItem => ({
                service: item.category,
                amount: item.amount,
                change: item.change,
                trend: item.trend,
              })
            )
          )
        );
      }
    } catch (error) {
      console.warn("Failed to fetch GitHub Actions cost data:", error);
    }
  }

  // Aggregate breakdowns from all live sources
  const allBreakdowns = await Promise.all(breakdownPromises);
  const combinedBreakdown = allBreakdowns.flat();

  // If no live data available, use mock data
  if (combinedBreakdown.length === 0) {
    result.sources.mock = true;
    result.report.totalSpend = mockCostTotals.totalSpend;
    result.report.breakdown = mockCostBreakdown;
    result.report.anomalies = mockCostAnomalies;
    result.report.summary =
      "Using bundled cost dataset. Connect Vercel, OpenAI, or ensure GitHub Actions tracking is enabled for live spend data.";
    result.report.riskLevel = "low";
  } else {
    result.report.breakdown = combinedBreakdown;
    result.report.anomalies = anomalies.length > 0 ? anomalies : [];
    result.report.summary = `Aggregated cost data from ${
      [
        result.sources.vercel.live && "Vercel",
        result.sources.openai.live && "OpenAI",
        result.sources.github.live && "GitHub",
      ]
        .filter(Boolean)
        .join(", ") || "live sources"
    }. Total: $${result.report.totalSpend.toFixed(2)}.`;

    // Determine risk level based on anomalies
    const hasHighSeverity = anomalies.some((a) => a.severity === "high");
    const hasMediumSeverity = anomalies.some((a) => a.severity === "medium");
    result.report.riskLevel = hasHighSeverity ? "high" : hasMediumSeverity ? "medium" : "low";
  }

  return result;
}

/**
 * Get cost data source status for display
 */
export async function getCostDataSources(): Promise<
  {
    service: string;
    connected: boolean;
    live: boolean;
    message: string;
  }[]
> {
  const vercelStatus = getVercelConnectionStatus();
  const openaiStatus = getOpenAIConnectionStatus();
  const githubSession = await getGitHubSession();
  const githubStatus = getGitHubActionsConnectionStatus(Boolean(githubSession?.accessToken));

  return [
    {
      service: "Vercel",
      connected: vercelStatus.configured,
      live: vercelStatus.configured, // Will be verified on next fetch
      message: vercelStatus.message,
    },
    {
      service: "OpenAI",
      connected: openaiStatus.configured,
      live: openaiStatus.configured,
      message: openaiStatus.message,
    },
    {
      service: "GitHub Actions",
      connected: githubStatus.configured,
      live: githubStatus.configured,
      message: githubStatus.message,
    },
  ];
}
