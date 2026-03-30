import type {
  RuntimeBridge,
  Session,
  ToolResult,
  JobStatus,
} from "@/types/runtime";
import { recordSecurityEvent } from "@/lib/security/events";
import { evaluateRuntimeRequestedTools, getRuntimeToolPolicy } from "@/lib/security/runtime-policy";

const sessions: Map<string, Session> = new Map();
const jobs: Map<string, JobStatus> = new Map();

export function createMockBridge(): RuntimeBridge {
  return {
    provider: "mock",

    async getStatus() {
      return {
        provider: "mock",
        mode: "mock",
        configured: true,
        healthy: true,
        description: "Authrix is using the local mock runtime bridge.",
        checkedAt: new Date().toISOString(),
        toolPolicy: getRuntimeToolPolicy(),
      };
    },

    async executeAgent<TInput, TOutput>(request: {
      agentId: string;
      input: TInput;
      tools?: string[];
      sessionId?: string;
    }) {
      const start = Date.now();

      // Mock: delegate to local agent functions (imported dynamically to avoid circular deps)
      const { runAgent } = await import("@/lib/agents");
      const output = (await runAgent(
        request.agentId,
        request.input
      )) as TOutput;
      const toolEvaluation = evaluateRuntimeRequestedTools(request.tools);

      if (toolEvaluation.blockedTools.length > 0) {
        await recordSecurityEvent({
          level: "warning",
          category: "runtime_policy",
          title: "Runtime tools blocked by policy",
          description: `Authrix blocked ${toolEvaluation.blockedTools.length} requested runtime tool(s) for the ${request.agentId} agent while running through the mock bridge.`,
          metadata: {
            agentId: request.agentId,
            blockedTools: toolEvaluation.blockedTools,
            provider: "mock",
          },
        });
      }

      return {
        output,
        metadata: {
          executionTimeMs: Date.now() - start,
          timestamp: new Date().toISOString(),
          provider: "mock",
          allowedTools: toolEvaluation.allowedTools,
          blockedTools: toolEvaluation.blockedTools.map((entry) => entry.tool),
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
        metadata: {
          ...(config.metadata ?? {}),
          model: config.model,
          agentId: config.agentId,
        },
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
      const evaluation = evaluateRuntimeRequestedTools([request.tool]);
      const blocked = evaluation.blockedTools[0];

      if (blocked) {
        await recordSecurityEvent({
          level: "warning",
          category: "runtime_policy",
          title: "Runtime tool invocation blocked",
          description: `Authrix blocked the runtime tool "${request.tool}" in mock mode because ${blocked.reason}.`,
          metadata: {
            tool: request.tool,
            reason: blocked.reason,
            provider: "mock",
          },
        });

        return {
          success: false,
          output: null,
          error: `Runtime tool "${request.tool}" was blocked by policy: ${blocked.reason}.`,
          metadata: {
            blockedByPolicy: true,
          },
        };
      }

      // Mock: return a no-op success
      return {
        success: true,
        output: { tool: request.tool, message: "Mock tool execution" },
        metadata: {
          allowedByPolicy: true,
        },
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
