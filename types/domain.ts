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

export type SourceSystem =
  | "github"
  | "meeting_upload"
  | "notes"
  | "billing"
  | "manual";

export interface SourceEvent {
  id: string;
  workspaceId: string;
  sourceSystem: SourceSystem;
  eventType: string;
  title: string;
  description: string;
  occurredAt: string;
  actor?: string;
  url?: string;
  externalId?: string;
  metadata: Record<string, unknown>;
}

export interface TranscriptEntry {
  speaker: string;
  text: string;
  timestamp: string;
}

export interface SourceDocument {
  id: string;
  workspaceId: string;
  sourceSystem: SourceSystem;
  documentType: "transcript" | "notes" | "summary";
  title: string;
  createdAt: string;
  content: string;
  participants: string[];
  transcript?: TranscriptEntry[];
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

export interface MeetingActionItem {
  id: string;
  title: string;
  description: string;
  owner?: string;
  dueDate?: string;
  status: "identified" | "suggested" | "approved" | "completed";
}

export interface MeetingArtifact {
  id: string;
  workspaceId: string;
  sourceDocumentId: string;
  title: string;
  generatedAt: string;
  summary: string;
  notes: string[];
  participants: string[];
  actionItems: MeetingActionItem[];
  decisions: string[];
  openQuestions: string[];
}

export interface DecisionRecord {
  id: string;
  workspaceId: string;
  title: string;
  summary: string;
  participants: string[];
  status: "open" | "accepted" | "superseded";
  sourceAgentId: string;
  sourceDocumentId?: string;
  createdAt: string;
  relatedTaskIds: string[];
}

export interface RiskAlert {
  id: string;
  workspaceId: string;
  title: string;
  description: string;
  severity: RiskLevel;
  category: "engineering" | "workflow" | "operations" | "drift";
  sourceAgentId: string;
  createdAt: string;
  relatedRecordIds: string[];
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
  proposedActionId?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  executionResult?: string;
  relatedRecordIds?: string[];
}

export interface ProposedAction {
  id: string;
  workspaceId: string;
  actionKind: string;
  title: string;
  description: string;
  targetSystem: string;
  riskLevel: RiskLevel;
  sourceAgentId: string;
  status: "proposed" | "approved" | "rejected" | "executed";
  createdAt: string;
  approvalRequestId?: string;
  relatedRecordIds: string[];
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
  relatedRecordIds?: string[];
}

// --- Audit ---

export interface AuditEvent {
  id: string;
  workspaceId: string;
  action: string;
  actor: string;
  target: string;
  details: string;
  timestamp: string;
  metadata: Record<string, unknown>;
  relatedRecordIds?: string[];
}

export interface AgentRunRecord {
  id: string;
  workspaceId: string;
  agentId: string;
  status: "completed" | "failed";
  startedAt: string;
  completedAt?: string;
  inputSummary: string;
  outputSummary: string;
  provider?: "local" | "runtime" | "model";
  runtimeSessionId?: string;
  fallbackReason?: string;
  relatedRecordIds: string[];
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
  mode?: "mock" | "live" | "token-vault";
  description?: string;
  lastSyncedAt?: string;
}

export type WorkspacePipelineProvider =
  | "github"
  | "local"
  | "model"
  | "runtime"
  | "mock";

export type WorkspacePipelineHealth = "ready" | "fallback" | "error";

export interface WorkspacePipelineStatus {
  id: string;
  label: string;
  provider: WorkspacePipelineProvider;
  health: WorkspacePipelineHealth;
  message: string;
  updatedAt: string;
}

export interface WorkspaceStateInfo {
  storage: "filesystem";
  refreshedAt: string;
  persistedAt: string;
  pipelines: WorkspacePipelineStatus[];
}

export interface WorkspaceSnapshot {
  workspace: Workspace;
  state: WorkspaceStateInfo;
  integrations: IntegrationStatus[];
  sourceEvents: SourceEvent[];
  sourceDocuments: SourceDocument[];
  engineeringActivities: EngineeringActivity[];
  engineeringSummary: EngineeringSummary;
  meetingArtifacts: MeetingArtifact[];
  decisionRecords: DecisionRecord[];
  tasks: SuggestedTask[];
  costReport: CostReport;
  riskAlerts: RiskAlert[];
  proposedActions: ProposedAction[];
  approvalRequests: ApprovalRequest[];
  auditEvents: AuditEvent[];
  agentRuns: AgentRunRecord[];
  timeline: TimelineEntry[];
}
