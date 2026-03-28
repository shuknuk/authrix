import { devopsAgent, engineerAgent, taskAgent } from "@/lib/agents";
import { mockApprovals } from "@/lib/mock/approvals";
import {
  mockGitHubEvents,
  normalizeGitHubEvents,
} from "@/lib/mock/github-activity";
import { mockIntegrations } from "@/lib/mock/integrations";
import {
  mockCostAnomalies,
  mockCostBreakdown,
  mockCostTotals,
} from "@/lib/mock/cost-data";
import type {
  ApprovalRequest,
  ApprovalStatus,
  CostReport,
  EngineeringActivity,
  EngineeringSummary,
  IntegrationStatus,
  SuggestedTask,
  TimelineEntry,
} from "@/types/domain";
import type { EngineerAgentInput } from "@/types/agents";

const SUMMARY_PERIOD = {
  start: "2026-03-21T00:00:00Z",
  end: "2026-03-28T00:00:00Z",
};

function getEngineeringActivities(): EngineeringActivity[] {
  return normalizeGitHubEvents(mockGitHubEvents);
}

export async function getEngineeringSummary(): Promise<EngineeringSummary> {
  const input: EngineerAgentInput = {
    activities: getEngineeringActivities(),
    period: SUMMARY_PERIOD,
  };

  return engineerAgent(input).summary;
}

export async function getSuggestedTasks(): Promise<SuggestedTask[]> {
  const summary = await getEngineeringSummary();
  return taskAgent({ summary }).tasks;
}

export async function getCostReport(): Promise<CostReport> {
  return devopsAgent({
    costBreakdown: mockCostBreakdown,
    anomalies: mockCostAnomalies,
    period: mockCostTotals.period,
    totalSpend: mockCostTotals.totalSpend,
    currency: mockCostTotals.currency,
  }).report;
}

export async function getApprovalRequests(): Promise<ApprovalRequest[]> {
  return [...mockApprovals].sort(
    (a, b) =>
      new Date(b.requestedAt).getTime() - new Date(a.requestedAt).getTime()
  );
}

export async function updateApprovalRequest(
  id: string,
  status: Exclude<ApprovalStatus, "pending">
): Promise<ApprovalRequest | null> {
  const approval = mockApprovals.find((item) => item.id === id);
  if (!approval) {
    return null;
  }

  approval.status = status;
  approval.resolvedAt = new Date().toISOString();
  approval.resolvedBy = "current-user"; // MOCK: replace with real auth

  return approval;
}

export async function getTimelineEntries(): Promise<TimelineEntry[]> {
  const timeline = getEngineeringActivities().map<TimelineEntry>((activity) => ({
    id: `timeline-${activity.id}`,
    type: activity.eventType,
    title: activity.title,
    description: activity.summary,
    source: activity.source,
    timestamp: activity.timestamp,
    metadata: {
      repo: activity.repo,
      author: activity.author,
      impact: activity.impact,
    },
  }));

  timeline.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return timeline;
}

export async function getIntegrationStatuses(): Promise<IntegrationStatus[]> {
  return mockIntegrations;
}
