import { docsAgent } from "@/lib/agents";
import { getRuntimeBridge } from "@/lib/runtime/bridge";
import type { DocsAgentInput, DocsAgentOutput } from "@/types/agents";

type DocsExecutionMode = "auto" | "local" | "runtime";

export interface DocsPipelineExecution {
  output: DocsAgentOutput;
  executionTimeMs: number;
  timestamp: string;
  provider: "local" | "runtime";
  sessionId?: string;
  fallbackReason?: string;
}

export async function runDocsPipeline(
  input: DocsAgentInput
): Promise<DocsPipelineExecution> {
  const bridge = getRuntimeBridge();
  const runtimeStatus = await bridge.getStatus();
  const executionMode = resolveDocsExecutionMode();
  const shouldTryRuntime =
    executionMode === "runtime" ||
    (executionMode === "auto" &&
      bridge.provider === "openclaw" &&
      runtimeStatus.healthy);

  if (!shouldTryRuntime) {
    const localExecution = runLocalDocsPipeline(input);
    const usingFallback =
      executionMode !== "local" && bridge.provider === "openclaw" && !runtimeStatus.healthy;

    return {
      ...localExecution,
      fallbackReason: usingFallback ? runtimeStatus.description : undefined,
    };
  }

  try {
    const session = await bridge.createSession({
      agentId: "docs",
      label: `Authrix Docs Processing: ${input.sourceDocument.title}`,
    });

    const result = await bridge.executeAgent<DocsAgentInput, DocsAgentOutput>({
      agentId: "docs",
      input,
      sessionId: session.id,
    });

    return {
      output: result.output,
      executionTimeMs: result.metadata.executionTimeMs,
      timestamp: result.metadata.timestamp,
      provider: "runtime",
      sessionId: session.id,
    };
  } catch (error) {
    const localExecution = runLocalDocsPipeline(input);
    return {
      ...localExecution,
      fallbackReason: toErrorMessage(error),
    };
  }
}

function runLocalDocsPipeline(
  input: DocsAgentInput
): Omit<DocsPipelineExecution, "fallbackReason"> {
  const start = Date.now();
  const output = docsAgent(input);
  const timestamp = new Date().toISOString();

  return {
    output,
    executionTimeMs: Date.now() - start,
    timestamp,
    provider: "local",
  };
}

function resolveDocsExecutionMode(): DocsExecutionMode {
  const raw = process.env.AUTHRIX_DOCS_EXECUTION?.trim().toLowerCase();

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
