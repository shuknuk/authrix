import { engineerAgent } from "@/lib/agents";
import { runModelEngineerAgent } from "@/lib/models/agent-execution";
import { getModelProvider } from "@/lib/models/provider";
import { getDefaultModelForAgent } from "@/lib/models/registry";
import { getRuntimeBridge } from "@/lib/runtime/bridge";
import type { EngineerAgentInput, EngineerAgentOutput } from "@/types/agents";
import type { WorkspacePipelineStatus } from "@/types/domain";

type EngineerExecutionMode = "auto" | "local" | "model" | "runtime";

export interface EngineerPipelineExecution {
  output: EngineerAgentOutput;
  executionTimeMs: number;
  timestamp: string;
  provider: "local" | "model" | "runtime";
  sessionId?: string;
  fallbackReason?: string;
  pipelineStatus: WorkspacePipelineStatus;
}

export async function runEngineerPipeline(
  input: EngineerAgentInput
): Promise<EngineerPipelineExecution> {
  const bridge = getRuntimeBridge();
  const runtimeStatus = await bridge.getStatus();
  const modelProvider = getModelProvider();
  const model = getDefaultModelForAgent("engineer");
  const executionMode = resolveEngineerExecutionMode();
  const shouldTryRuntime =
    executionMode === "runtime" ||
    (executionMode === "auto" &&
      bridge.provider === "openclaw" &&
      runtimeStatus.healthy);
  const shouldTryModel =
    executionMode === "model" ||
    (executionMode === "auto" && !shouldTryRuntime && modelProvider.configured);

  if (shouldTryModel) {
    try {
      const start = Date.now();
      const output = await runModelEngineerAgent(input, model);
      const timestamp = new Date().toISOString();

      return {
        output,
        executionTimeMs: Date.now() - start,
        timestamp,
        provider: "model",
        pipelineStatus: {
          id: "engineering-summary",
          label: "Engineering summary",
          provider: "model",
          health: "ready",
          message: `Engineering summary was executed through the hosted model layer using ${model}.`,
          updatedAt: timestamp,
        },
      };
    } catch (error) {
      if (executionMode === "model") {
        const localExecution = runLocalEngineerPipeline(input);
        return {
          ...localExecution,
          fallbackReason: toErrorMessage(error),
          pipelineStatus: {
            id: "engineering-summary",
            label: "Engineering summary",
            provider: "local",
            health: "fallback",
            message: `Model execution failed, so Authrix used the local summary pipeline. ${toErrorMessage(
              error
            )}`,
            updatedAt: localExecution.timestamp,
          },
        };
      }
    }
  }

  if (!shouldTryRuntime) {
    const localExecution = runLocalEngineerPipeline(input);
    const usingFallback =
      executionMode !== "local" && bridge.provider === "openclaw" && !runtimeStatus.healthy;

    return {
      ...localExecution,
      fallbackReason: usingFallback ? runtimeStatus.description : undefined,
      pipelineStatus: {
        id: "engineering-summary",
        label: "Engineering summary",
        provider: "local",
        health: usingFallback ? "fallback" : "ready",
        message: usingFallback
          ? `Runtime execution was unavailable, so Authrix used the local summary pipeline. ${runtimeStatus.description}`
          : executionMode === "local"
            ? "Engineering summary is pinned to the local deterministic pipeline."
            : "Engineering summary is using the local deterministic pipeline until a live runtime is selected.",
        updatedAt: localExecution.timestamp,
      },
    };
  }

  try {
    const session = await bridge.createSession({
      agentId: "engineer",
      label: "Authrix Engineering Summary",
      model: getDefaultModelForAgent("engineer"),
    });

    const result = await bridge.executeAgent<EngineerAgentInput, EngineerAgentOutput>({
      agentId: "engineer",
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
        id: "engineering-summary",
        label: "Engineering summary",
        provider: "runtime",
        health: "ready",
        message: "Engineering summary was executed through the live runtime bridge.",
        updatedAt: result.metadata.timestamp,
      },
    };
  } catch (error) {
    const localExecution = runLocalEngineerPipeline(input);
    return {
      ...localExecution,
      fallbackReason: toErrorMessage(error),
      pipelineStatus: {
        id: "engineering-summary",
        label: "Engineering summary",
        provider: "local",
        health: "fallback",
        message: `Runtime execution failed, so Authrix used the local summary pipeline. ${toErrorMessage(
          error
        )}`,
        updatedAt: localExecution.timestamp,
      },
    };
  }
}

function runLocalEngineerPipeline(
  input: EngineerAgentInput
): Omit<EngineerPipelineExecution, "pipelineStatus"> {
  const start = Date.now();
  const output = engineerAgent(input);
  const timestamp = new Date().toISOString();

  return {
    output,
    executionTimeMs: Date.now() - start,
    timestamp,
    provider: "local",
  };
}

function resolveEngineerExecutionMode(): EngineerExecutionMode {
  const raw = process.env.AUTHRIX_ENGINEER_EXECUTION?.trim().toLowerCase();

  if (raw === "runtime") {
    return "runtime";
  }

  if (raw === "model") {
    return "model";
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
