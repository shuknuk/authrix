export type DataSource = "github" | "mock";
export type ActivityKind =
  | "commit"
  | "pull_request"
  | "issue"
  | "review"
  | "release"
  | "branch";

export interface NormalizedGitHubActivity {
  id: string;
  kind: ActivityKind;
  title: string;
  summary: string;
  repo: string;
  actor: string;
  occurredAt: string;
  url?: string;
  branch?: string;
  status?: string;
  source: DataSource;
}

export interface WeeklySummary {
  headline: string;
  overview: string;
  focusAreas: string[];
  accomplishments: string[];
  risks: string[];
  metrics: {
    mergedPullRequests: number;
    commits: number;
    issuesClosed: number;
    activeRepos: number;
  };
  momentum: "high" | "steady" | "watch";
}

export interface SuggestedTask {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  owner: string;
  rationale: string;
  approvalRequired: boolean;
}

export interface CostRiskInsight {
  spendUsd: string;
  budgetStatus: "on_track" | "watch" | "at_risk";
  summary: string;
  risks: string[];
  recommendations: string[];
  window: string;
}

export interface ApprovalRequest {
  action: "create_tasks" | "sync_followups" | "open_issue";
  label: string;
  payload: Record<string, unknown>;
  justification: string;
}

export interface ApprovalQueueItem {
  id: string;
  action: string;
  status: "pending" | "approved" | "executed" | "rejected";
  requestedAt: string;
  actor: string;
  summary: string;
}

export interface ExecutionResult {
  ok: boolean;
  message: string;
  queueItem: ApprovalQueueItem;
  simulated: boolean;
}

export interface ConnectionStatus {
  provider: "github";
  connected: boolean;
  account?: {
    login: string;
    name?: string;
    avatarUrl?: string;
  };
  scope?: string;
  source: DataSource | "unconfigured";
  lastSyncAt?: string;
  message: string;
}

export interface GitHubActivityResponse {
  connected: boolean;
  source: DataSource;
  fetchedAt: string;
  activities: NormalizedGitHubActivity[];
}

export interface DashboardViewModel {
  weeklySummary: WeeklySummary;
  suggestedTasks: SuggestedTask[];
  costRisk: CostRiskInsight;
  approvalQueue: ApprovalQueueItem[];
  github: GitHubActivityResponse;
  connectionStatus: ConnectionStatus;
}
