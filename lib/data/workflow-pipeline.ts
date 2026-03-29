import { workflowAgent } from "@/lib/agents";
import { getRuntimeBridge } from "@/lib/runtime/bridge";
import type { WorkflowAgentInput, WorkflowAgentOutput } from "@/types/agents";
import type { WorkspacePipelineStatus } from "@/types/domain";

type WorkflowExecutionMode = "auto" | "local" | "runtime";

export interface WorkflowPipelineExecution {
  output: WorkflowAgentOutput;
  executionTimeMs: number;
  timestamp: string;
  provider: "local" | "runtime";
  sessionId?: string;
  fallbackReason?: string;
  pipelineStatus: WorkspacePipelineStatus;
}

export async function runWorkflowPipeline(
  input: WorkflowAgentInput
): Promise<WorkflowPipelineExecution> {
  const bridge = getRuntimeBridge();
  const runtimeStatus = await bridge.getStatus();
  const executionMode = resolveWorkflowExecutionMode();
  const shouldTryRuntime =
    executionMode === "runtime" ||
    (executionMode === "auto" &&
      bridge.provider === "openclaw" &&
      runtimeStatus.healthy);

  if (!shouldTryRuntime) {
    const localExecution = runLocalWorkflowPipeline(input);
    const usingFallback =
      executionMode !== "local" && bridge.provider === "openclaw" && !runtimeStatus.healthy;

    return {
      ...localExecution,
      fallbackReason: usingFallback ? runtimeStatus.description : undefined,
      pipelineStatus: {
        id: "workflow-follow-through",
        label: "Workflow follow-through",
        provider: "local",
        health: usingFallback ? "fallback" : "ready",
        message: usingFallback
          ? `Runtime execution was unavailable, so Authrix used the local workflow pipeline. ${runtimeStatus.description}`
          : executionMode === "local"
            ? "Workflow follow-through is pinned to the local deterministic pipeline."
            : "Workflow follow-through is using the local deterministic pipeline until a live runtime is selected.",
        updatedAt: localExecution.timestamp,
      },
    };
  }

  try {
    const session = await bridge.createSession({
      agentId: "workflow",
      label: "Authrix Workflow Follow-Through",
    });

    const result = await bridge.executeAgent<WorkflowAgentInput, WorkflowAgentOutput>({
      agentId: "workflow",
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
        id: "workflow-follow-through",
        label: "Workflow follow-through",
        provider: "runtime",
        health: "ready",
        message: "Workflow follow-through was executed through the live runtime bridge.",
        updatedAt: result.metadata.timestamp,
      },
    };
  } catch (error) {
    const localExecution = runLocalWorkflowPipeline(input);
    return {
      ...localExecution,
      fallbackReason: toErrorMessage(error),
      pipelineStatus: {
        id: "workflow-follow-through",
        label: "Workflow follow-through",
        provider: "local",
        health: "fallback",
        message: `Runtime execution failed, so Authrix used the local workflow pipeline. ${toErrorMessage(
          error
        )}`,
        updatedAt: localExecution.timestamp,
      },
    };
  }
}

function runLocalWorkflowPipeline(
  input: WorkflowAgentInput
): Omit<WorkflowPipelineExecution, "pipelineStatus"> {
  const start = Date.now();
  const output = workflowAgent(input);
  const timestamp = new Date().toISOString();

  return {
    output,
    executionTimeMs: Date.now() - start,
    timestamp,
    provider: "local",
  };
}

function resolveWorkflowExecutionMode(): WorkflowExecutionMode {
  const raw = process.env.AUTHRIX_WORKFLOW_EXECUTION?.trim().toLowerCase();

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
