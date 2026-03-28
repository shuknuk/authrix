import type {
  RuntimeBridge,
  Session,
  ToolResult,
  JobStatus,
} from "@/types/runtime";

const sessions: Map<string, Session> = new Map();
const jobs: Map<string, JobStatus> = new Map();

export function createMockBridge(): RuntimeBridge {
  return {
    async executeAgent<TInput, TOutput>(request: {
      agentId: string;
      input: TInput;
      tools?: string[];
    }) {
      const start = Date.now();

      // Mock: delegate to local agent functions (imported dynamically to avoid circular deps)
      const { runAgent } = await import("@/lib/agents");
      const output = (await runAgent(
        request.agentId,
        request.input
      )) as TOutput;

      return {
        output,
        metadata: {
          executionTimeMs: Date.now() - start,
          timestamp: new Date().toISOString(),
        },
      };
    },

    async createSession(config) {
      const id = `session_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const session: Session = {
        id,
        label: config.label,
        createdAt: new Date().toISOString(),
        lastActiveAt: new Date().toISOString(),
        metadata: config.metadata ?? {},
      };
      sessions.set(id, session);
      return session;
    },

    async getSession(sessionId) {
      return sessions.get(sessionId) ?? null;
    },

    async listSessions() {
      return Array.from(sessions.values());
    },

    async invokeTool(request: {
      tool: string;
      args: Record<string, unknown>;
      sessionId?: string;
    }): Promise<ToolResult> {
      // Mock: return a no-op success
      return {
        success: true,
        output: { tool: request.tool, message: "Mock tool execution" },
      };
    },

    async submitJob(request) {
      const id = `job_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const job: JobStatus = {
        id,
        state: "completed",
        createdAt: new Date().toISOString(),
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        result: { type: request.type, message: "Mock job completed" },
      };
      jobs.set(id, job);
      return id;
    },

    async getJobStatus(jobId) {
      return (
        jobs.get(jobId) ?? {
          id: jobId,
          state: "failed" as const,
          createdAt: new Date().toISOString(),
          error: "Job not found",
        }
      );
    },
  };
}
