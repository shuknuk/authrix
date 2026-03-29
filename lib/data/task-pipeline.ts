import { taskAgent } from "@/lib/agents";
import { getRuntimeBridge } from "@/lib/runtime/bridge";
import type { TaskAgentInput, TaskAgentOutput } from "@/types/agents";
import type { WorkspacePipelineStatus } from "@/types/domain";

type TaskExecutionMode = "auto" | "local" | "runtime";

export interface TaskPipelineExecution {
  output: TaskAgentOutput;
  executionTimeMs: number;
  timestamp: string;
  provider: "local" | "runtime";
  sessionId?: string;
  fallbackReason?: string;
  pipelineStatus: WorkspacePipelineStatus;
}

export async function runTaskPipeline(
  input: TaskAgentInput
): Promise<TaskPipelineExecution> {
  const bridge = getRuntimeBridge();
  const runtimeStatus = await bridge.getStatus();
  const executionMode = resolveTaskExecutionMode();
  const shouldTryRuntime =
    executionMode === "runtime" ||
    (executionMode === "auto" &&
      bridge.provider === "openclaw" &&
      runtimeStatus.healthy);

  if (!shouldTryRuntime) {
    const localExecution = runLocalTaskPipeline(input);
    const usingFallback =
      executionMode !== "local" && bridge.provider === "openclaw" && !runtimeStatus.healthy;

    return {
      ...localExecution,
      fallbackReason: usingFallback ? runtimeStatus.description : undefined,
      pipelineStatus: {
        id: "task-suggestions",
        label: "Task suggestions",
        provider: "local",
        health: usingFallback ? "fallback" : "ready",
        message: usingFallback
          ? `Runtime execution was unavailable, so Authrix used the local task pipeline. ${runtimeStatus.description}`
          : executionMode === "local"
            ? "Task suggestions are pinned to the local deterministic pipeline."
            : "Task suggestions are using the local deterministic pipeline until a live runtime is selected.",
        updatedAt: localExecution.timestamp,
      },
    };
  }

  try {
    const session = await bridge.createSession({
      agentId: "task",
      label: "Authrix Task Suggestions",
    });

    const result = await bridge.executeAgent<TaskAgentInput, TaskAgentOutput>({
      agentId: "task",
      input,
      sessionId: session.id,
    });

    return {
      output: result.output,
      executionTimeMs: result.metadata.executionTimeMs,
      timestamp: result.metadata.timestamp,
      provider: "runtime",
      sessionId: session.id,
      pipelineStatus: {
        id: "task-suggestions",
        label: "Task suggestions",
        provider: "runtime",
        health: "ready",
        message: "Task suggestions were executed through the live runtime bridge.",
        updatedAt: result.metadata.timestamp,
      },
    };
  } catch (error) {
    const localExecution = runLocalTaskPipeline(input);
    return {
      ...localExecution,
      fallbackReason: toErrorMessage(error),
      pipelineStatus: {
        id: "task-suggestions",
        label: "Task suggestions",
        provider: "local",
        health: "fallback",
        message: `Runtime execution failed, so Authrix used the local task pipeline. ${toErrorMessage(
          error
        )}`,
        updatedAt: localExecution.timestamp,
      },
    };
  }
}

function runLocalTaskPipeline(
  input: TaskAgentInput
): Omit<TaskPipelineExecution, "pipelineStatus"> {
  const start = Date.now();
  const output = taskAgent(input);
  const timestamp = new Date().toISOString();

  return {
    output,
    executionTimeMs: Date.now() - start,
    timestamp,
    provider: "local",
  };
}

function resolveTaskExecutionMode(): TaskExecutionMode {
  const raw = process.env.AUTHRIX_TASK_EXECUTION?.trim().toLowerCase();

  if (raw === "runtime") {
    return "runtime";
  }

  if (raw === "local") {
    return "local";
  }

  return "auto";
}

function toErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "Unknown runtime error.";
}
