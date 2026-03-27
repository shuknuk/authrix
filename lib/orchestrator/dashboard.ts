import "server-only";
import { engineerAgent } from "@/lib/agents/engineerAgent";
import { taskAgent } from "@/lib/agents/taskAgent";
import { devopsAgent } from "@/lib/agents/devopsAgent";
import { getGitHubActivityFeed, getConnectionStatus } from "@/lib/github/service";
import { getMockUsageCostInput } from "@/lib/mock/costs";
import { listApprovalQueue } from "@/lib/orchestrator/approval-store";
import type { DashboardViewModel } from "@/types/authrix";

export async function getDashboardViewModel(): Promise<DashboardViewModel> {
  const [github, connectionStatus] = await Promise.all([
    getGitHubActivityFeed(),
    getConnectionStatus(),
  ]);

  const weeklySummary = engineerAgent(github.activities);
  const suggestedTasks = taskAgent(weeklySummary);
  const costRisk = devopsAgent(getMockUsageCostInput());

  return {
    weeklySummary,
    suggestedTasks,
    costRisk,
    approvalQueue: listApprovalQueue(),
    github,
    connectionStatus,
  };
}
