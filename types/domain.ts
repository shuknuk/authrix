// ---------------------------------------------------------------------------
// Core domain types for Authrix
// These types define the structured records that flow through the entire system.
// ---------------------------------------------------------------------------

// --- Source events ---

export interface GitHubEvent {
  id: string;
  type: "push" | "pull_request" | "issue" | "review" | "release";
  repo: string;
  author: string;
  title: string;
  description: string;
  url: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

// --- Normalized engineering activity ---

export type ActivitySource = "github" | "manual";

export interface EngineeringActivity {
  id: string;
  source: ActivitySource;
  eventType: string;
  repo: string;
  author: string;
  title: string;
  summary: string;
  impact: Impact;
  timestamp: string;
  rawEventId?: string;
}

// --- Shared enums ---

export type Impact = "low" | "medium" | "high";
export type RiskLevel = "low" | "medium" | "high";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type TaskStatus = "suggested" | "approved" | "rejected" | "completed";
export type ApprovalStatus = "pending" | "approved" | "rejected";
export type Trend = "up" | "down" | "stable";

// --- Engineering summary (engineer agent output) ---

export interface SummaryHighlight {
  title: string;
  description: string;
  impact: Impact;
  relatedActivityIds: string[];
}

export interface RepoSummary {
  repo: string;
  commitCount: number;
  prCount: number;
  issueCount: number;
  summary: string;
}

export interface ContributorSummary {
  author: string;
  commitCount: number;
  prCount: number;
  topRepos: string[];
}

export interface RiskFlag {
  title: string;
  description: string;
  severity: RiskLevel;
  relatedActivityIds: string[];
}

export interface EngineeringSummary {
  id: string;
  period: { start: string; end: string };
  generatedAt: string;
  overallSummary: string;
  highlights: SummaryHighlight[];
  repoBreakdown: RepoSummary[];
  contributorBreakdown: ContributorSummary[];
  riskFlags: RiskFlag[];
  activityCount: number;
}

// --- Tasks (task agent output) ---

export interface SuggestedTask {
  id: string;
  title: string;
  description: string;
  priority: TaskPriority;
  suggestedOwner?: string;
  dueDate?: string;
  source: string;
  sourceAgentId: string;
  status: TaskStatus;
  createdAt: string;
}

// --- Cost / risk (devops agent output) ---

export interface CostBreakdownItem {
  service: string;
  amount: number;
  change: number;
  trend: Trend;
}

export interface CostAnomaly {
  service: string;
  description: string;
  severity: RiskLevel;
  detectedAt: string;
}

export interface CostReport {
  id: string;
  period: { start: string; end: string };
  generatedAt: string;
  totalSpend: number;
  currency: string;
  breakdown: CostBreakdownItem[];
  anomalies: CostAnomaly[];
  riskLevel: RiskLevel;
  summary: string;
}

// --- Approvals ---

export interface ApprovalRequest {
  id: string;
  actionKind: string;
  title: string;
  description: string;
  sourceAgent: string;
  affectedSystem: string;
  riskLevel: RiskLevel;
  status: ApprovalStatus;
  requestedAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  executionResult?: string;
}

// --- Timeline ---

export interface TimelineEntry {
  id: string;
  type: string;
  title: string;
  description: string;
  source: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

// --- Audit ---

export interface AuditEvent {
  id: string;
  action: string;
  actor: string;
  target: string;
  details: string;
  timestamp: string;
  metadata: Record<string, unknown>;
}

// --- Workspace ---

export interface Workspace {
  id: string;
  name: string;
  createdAt: string;
  integrations: IntegrationStatus[];
}

export interface IntegrationStatus {
  service: string;
  connected: boolean;
  connectedAt?: string;
  scopes?: string[];
  status: "active" | "inactive" | "error";
}
