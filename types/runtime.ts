// ---------------------------------------------------------------------------
// Runtime bridge interface
// This is the key architectural seam between Authrix product code and the
// internal autonomous runtime layer. Mock and live implementations can sit
// behind this seam without changing product code.
// ---------------------------------------------------------------------------

export interface ExecutionMetadata {
  executionTimeMs: number;
  timestamp: string;
  sessionId?: string;
  provider: RuntimeProvider;
  allowedTools?: string[];
  blockedTools?: string[];
}

export interface SessionConfig {
  label?: string;
  agentId?: string;
  key?: string;
  model?: string;
  parentSessionKey?: string;
  metadata?: Record<string, unknown>;
}

export interface Session {
  id: string;
  label?: string;
  createdAt: string;
  lastActiveAt: string;
  metadata: Record<string, unknown>;
}

export type RuntimeSessionOrigin = "slack" | "web" | "api" | "system";
export type RuntimeSessionState = "active" | "paused" | "closed" | "error";

export interface ToolResult {
  success: boolean;
  output: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
}

export type RuntimeProvider = "mock" | "openclaw";

export interface RuntimeStatus {
  provider: RuntimeProvider;
  mode: "mock" | "live" | "disconnected";
  configured: boolean;
  healthy: boolean;
  description: string;
  checkedAt: string;
  url?: string;
  agentId?: string;
  availableMethods?: string[];
  toolPolicy?: {
    allowedTools: string[];
    blockedTools: string[];
    hostLevelToolsAllowed: boolean;
    mode: "default-deny-host" | "allowlist" | "mixed";
  };
  sessionCount?: number;
  activeRunCount?: number;
  recentRunCount?: number;
}

export type JobState = "queued" | "running" | "completed" | "failed";

export interface JobStatus {
  id: string;
  state: JobState;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  result?: unknown;
  error?: string;
}

export type RuntimeTranscriptEventType =
  | "session_created"
  | "agent_input"
  | "agent_output"
  | "run_status"
  | "tool_result";

export type RuntimeTranscriptRole = "user" | "assistant" | "system" | "tool";

export interface RuntimeBridge {
  readonly provider: RuntimeProvider;

  getStatus(): Promise<RuntimeStatus>;

  executeAgent<TInput, TOutput>(request: {
    agentId: string;
    input: TInput;
    tools?: string[];
    sessionId?: string;
  }): Promise<{ output: TOutput; metadata: ExecutionMetadata }>;

  createSession(config: SessionConfig): Promise<Session>;
  getSession(sessionId: string): Promise<Session | null>;
  listSessions(): Promise<Session[]>;

  invokeTool(request: {
    tool: string;
    args: Record<string, unknown>;
    sessionId?: string;
  }): Promise<ToolResult>;

  submitJob(request: {
    type: string;
    payload: Record<string, unknown>;
    schedule?: string;
  }): Promise<string>;
  getJobStatus(jobId: string): Promise<JobStatus>;
}

// Runtime session/run records for persistence layer

export interface RuntimeSessionRecord {
  id: string;
  workspaceId: string;
  label?: string;
  createdAt: string;
  lastActiveAt: string;
  lastRunAt?: string;
  origin: RuntimeSessionOrigin;
  state: "active" | "paused" | "closed" | "error";
  runCount: number;
  messageCount: number;
  lastError?: string;
  metadata: Record<string, unknown>;
}

export type RuntimeRunRecord = {
  id: string;
  sessionId: string;
  agentId: string;
  provider: RuntimeProvider;
  origin: RuntimeSessionOrigin;
  status: JobState;
  createdAt: string;
  startedAt?: string;
  completedAt?: string;
  inputSummary: string;
  outputSummary?: string;
  error?: string;
  tools: string[];
  metadata: Record<string, unknown>;
};

export interface RuntimeTranscriptEvent {
  id: string;
  sessionId: string;
  runId?: string;
  role: "system" | "user" | "assistant" | "tool";
  type: "run_status" | "agent_input" | "agent_output" | "tool_call" | "tool_result" | "session_created" | "session_closed";
  content: string;
  createdAt: string;
  metadata: Record<string, unknown>;
}

// Runtime control events

export type RuntimeControlEventType = "bridge_reset" | "mode_switch" | "health_check";

export type RuntimeControlEventStatus = "succeeded" | "failed" | "pending";

export interface RuntimeControlEvent {
  id: string;
  type: RuntimeControlEventType;
  status: RuntimeControlEventStatus;
  createdAt: string;
  message: string;
  metadata: Record<string, unknown>;
}
