// ---------------------------------------------------------------------------
// Runtime bridge interface
// This is the key architectural seam between Authrix product code and the
// autonomous runtime (OpenClaw). Mocked for MVP, swapped for real later.
// ---------------------------------------------------------------------------

export interface ExecutionMetadata {
  executionTimeMs: number;
  timestamp: string;
  sessionId?: string;
  provider: RuntimeProvider;
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

export interface ToolResult {
  success: boolean;
  output: unknown;
  error?: string;
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
