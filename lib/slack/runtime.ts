import { postSlackReply } from "@/lib/slack/client";
import { buildSlackRunOutcomeReply } from "@/lib/slack/operations";
import { recordSlackRuntimeRunUpdate } from "@/lib/slack/store";
import {
  createRuntimeSession,
  getRuntimeRunDetails,
  queueRuntimeAgentRun,
} from "@/lib/runtime/service";
import type {
  NormalizedSlackMessage,
  RoutedSlackAgentId,
  SlackConversation,
} from "@/types/messaging";
import type { JobState } from "@/types/runtime";

const DEFAULT_SETTLE_TIMEOUT_MS = 20_000;
const DEFAULT_POLL_INTERVAL_MS = 1_000;

export async function bindSlackThreadRuntime(input: {
  message: NormalizedSlackMessage;
  routedAgentId: RoutedSlackAgentId;
  existingConversation: SlackConversation | null;
}): Promise<{
  sessionId: string;
  sessionMode: "created" | "reused";
  runId: string;
  runStatus: JobState;
}> {
  const preferredSessionId = input.existingConversation?.runtimeSessionId;
  const label = buildSlackSessionLabel(
    preferredSessionId ? input.existingConversation?.title ?? input.message.text : input.message.text,
    input.routedAgentId
  );

  if (preferredSessionId) {
    try {
      const run = await queueRuntimeAgentRun({
        agentId: input.routedAgentId,
        sessionId: preferredSessionId,
        origin: "slack",
        label,
        metadata: buildSlackRuntimeMetadata(input.message),
        payload: {
          request: input.message.text,
        },
      });

      return {
        sessionId: preferredSessionId,
        sessionMode: "reused",
        runId: run.id,
        runStatus: run.status,
      };
    } catch {
      // Fall through to a fresh session if the stored binding no longer resolves.
    }
  }

  const session = await createRuntimeSession({
    agentId: input.routedAgentId,
    label,
    origin: "slack",
    metadata: buildSlackRuntimeMetadata(input.message),
  });
  const run = await queueRuntimeAgentRun({
    agentId: input.routedAgentId,
    sessionId: session.id,
    origin: "slack",
    label,
    metadata: buildSlackRuntimeMetadata(input.message),
    payload: {
      request: input.message.text,
    },
  });

  return {
    sessionId: session.id,
    sessionMode: "created",
    runId: run.id,
    runStatus: run.status,
  };
}

export async function monitorSlackThreadRun(input: {
  conversationId: string;
  channelId: string;
  threadTs: string;
  routedAgentId: RoutedSlackAgentId;
  sessionId: string;
  runId: string;
}): Promise<void> {
  const settled = await waitForRunSettlement(input.runId);

  if (!settled) {
    const replyText = buildSlackRunOutcomeReply({
      routedAgentId: input.routedAgentId,
      status: "running",
      sessionId: input.sessionId,
      runId: input.runId,
    });

    await recordSlackRuntimeRunUpdate({
      conversationId: input.conversationId,
      agentId: input.routedAgentId,
      runId: input.runId,
      sessionId: input.sessionId,
      status: "running",
      replyText,
    });

    try {
      await postSlackReply({
        channel: input.channelId,
        threadTs: input.threadTs,
        text: replyText,
      });
    } catch {
      // The in-progress update is already persisted locally.
    }

    return;
  }

  const replyText = buildSlackRunOutcomeReply({
    routedAgentId: input.routedAgentId,
    status: settled.run.status === "failed" ? "failed" : "completed",
    outputSummary: settled.run.outputSummary,
    error: settled.run.error,
    sessionId: input.sessionId,
    runId: input.runId,
  });

  await recordSlackRuntimeRunUpdate({
    conversationId: input.conversationId,
    agentId: input.routedAgentId,
    runId: input.runId,
    sessionId: input.sessionId,
    status: settled.run.status,
    outputSummary: settled.run.outputSummary,
    error: settled.run.error,
    replyText,
    createdAt: settled.run.completedAt ?? new Date().toISOString(),
  });

  try {
    await postSlackReply({
      channel: input.channelId,
      threadTs: input.threadTs,
      text: replyText,
    });
  } catch {
    // The completion update is already persisted locally.
  }
}

async function waitForRunSettlement(
  runId: string,
  timeoutMs = DEFAULT_SETTLE_TIMEOUT_MS,
  pollIntervalMs = DEFAULT_POLL_INTERVAL_MS
) {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() <= deadline) {
    const details = await getRuntimeRunDetails(runId);
    if (details && (details.run.status === "completed" || details.run.status === "failed")) {
      return details;
    }

    await sleep(pollIntervalMs);
  }

  return null;
}

function buildSlackSessionLabel(text: string, routedAgentId: RoutedSlackAgentId): string {
  const normalized = text.replace(/\s+/g, " ").trim();
  const clipped = normalized.length > 56 ? `${normalized.slice(0, 53)}...` : normalized;
  return `Slack ${routedAgentId}: ${clipped || "thread"}`;
}

function buildSlackRuntimeMetadata(message: NormalizedSlackMessage): Record<string, unknown> {
  return {
    platform: "slack",
    channelId: message.channelId,
    threadTs: message.threadTs,
    slackTs: message.slackTs,
    userId: message.userId,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
