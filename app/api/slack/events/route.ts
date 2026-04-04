import { NextResponse } from "next/server";
import { classifyIncomingRequest } from "@/lib/models/router";
import {
  buildSlackApprovalBlocks,
  buildSlackApprovalQueueText,
  listPendingApprovalsForSlack,
  resolveSlackApprovalAction,
  resolveSlackApprovalIntent,
} from "@/lib/slack/approvals";
import {
  buildSlackClarifyingReply,
  resolveSlackClarifyingQuestion,
} from "@/lib/slack/clarify";
import {
  buildSlackAcknowledgement,
  planSlackDelegations,
  planSlackTaskDispatches,
} from "@/lib/slack/operations";
import { bindSlackThreadRuntime, monitorSlackThreadRun } from "@/lib/slack/runtime";
import { getSlackConfig, isSlackEventsConfigured } from "@/lib/slack/config";
import { postSlackReply } from "@/lib/slack/client";
import { verifySlackSignature } from "@/lib/slack/signature";
import {
  findSlackConversationByThread,
  recordSlackDispatch,
} from "@/lib/slack/store";
import { recordSlackDispatchInWorkspace } from "@/lib/slack/workspace-sync";
import type { RoutedSlackAgentId, SlackConversation } from "@/types/messaging";
import type { RouteDecision } from "@/types/models";

export async function POST(request: Request) {
  if (!isSlackEventsConfigured()) {
    return NextResponse.json(
      { error: "Slack events are not configured for this Authrix environment." },
      { status: 503 }
    );
  }

  const body = await request.text();
  const config = getSlackConfig();
  const validSignature = verifySlackSignature({
    signingSecret: config.signingSecret ?? "",
    timestamp: request.headers.get("x-slack-request-timestamp"),
    signature: request.headers.get("x-slack-signature"),
    body,
  });

  if (!validSignature) {
    return NextResponse.json({ error: "Invalid Slack signature." }, { status: 401 });
  }

  const payload = JSON.parse(body) as SlackIncomingPayload;

  if (payload.type === "url_verification") {
    return NextResponse.json({ challenge: payload.challenge });
  }

  if (payload.type !== "event_callback" || !payload.event) {
    return NextResponse.json({ ok: true });
  }

  if (!shouldProcessSlackEvent(payload.event, config.botUserId)) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const normalizedMessage = {
    channelId: payload.event.channel,
    threadTs: payload.event.thread_ts ?? payload.event.ts,
    slackTs: payload.event.ts,
    userId: payload.event.user ?? "",
    text: payload.event.text ?? "",
  };

  const existingConversation = await findSlackConversationByThread({
    channelId: normalizedMessage.channelId,
    threadTs: normalizedMessage.threadTs,
  });
  const approvalIntent = resolveSlackApprovalIntent(normalizedMessage.text);
  if (approvalIntent) {
    const approvalRouteDecision = buildApprovalRouteDecision(
      existingConversation,
      approvalIntent
    );
    const approvalAgentId = existingConversation
      ? normalizeRoutedSlackAgentId(existingConversation.routedAgentId)
      : "workflow";
    const pendingApprovals =
      approvalIntent.kind === "queue" ? await listPendingApprovalsForSlack() : [];
    const replyText =
      approvalIntent.kind === "queue"
        ? buildSlackApprovalQueueText(pendingApprovals)
        : await resolveSlackApprovalAction({
            approvalId: approvalIntent.approvalId,
            status: approvalIntent.kind === "approve" ? "approved" : "rejected",
            actor: normalizedMessage.userId || "slack-user",
          });
    const replyBlocks =
      approvalIntent.kind === "queue" && pendingApprovals.length > 0
        ? buildSlackApprovalBlocks(pendingApprovals)
        : undefined;
    const dispatch = await recordSlackDispatch({
      message: normalizedMessage,
      routedAgentId: approvalAgentId,
      routeDecision: approvalRouteDecision,
      delegations: [],
      taskDispatches: [],
      replyText,
    });

    await recordSlackDispatchInWorkspace(dispatch);

    try {
      await postSlackReply({
        channel: normalizedMessage.channelId,
        threadTs: normalizedMessage.threadTs,
        text: replyText,
        blocks: replyBlocks,
      });
    } catch {
      // The approval reply is still captured locally in the control tower.
    }

    return NextResponse.json({
      ok: true,
      handled: "approval",
      routedAgentId: approvalAgentId,
      routeDecision: approvalRouteDecision,
    });
  }

  const routeDecision = existingConversation
    ? buildThreadReuseDecision(existingConversation)
    : await classifyIncomingRequest(normalizedMessage.text);
  const routedAgentId = existingConversation
    ? normalizeRoutedSlackAgentId(existingConversation.routedAgentId)
    : routeDecision.agentId;
  const clarificationQuestion = resolveSlackClarifyingQuestion({
    text: normalizedMessage.text,
    routedAgentId,
    hasRuntimeSession: Boolean(existingConversation?.runtimeSessionId),
  });
  if (clarificationQuestion) {
    const replyText = buildSlackClarifyingReply({
      routedAgentId,
      question: clarificationQuestion,
    });
    const dispatch = await recordSlackDispatch({
      message: normalizedMessage,
      routedAgentId,
      routeDecision,
      delegations: [],
      taskDispatches: [],
      replyText,
    });

    await recordSlackDispatchInWorkspace(dispatch);

    try {
      await postSlackReply({
        channel: normalizedMessage.channelId,
        threadTs: normalizedMessage.threadTs,
        text: replyText,
      });
    } catch {
      // The clarification prompt is already persisted in the local control tower.
    }

    return NextResponse.json({
      ok: true,
      needsClarification: true,
      routedAgentId,
      routeDecision,
    });
  }

  const createdAt = new Date().toISOString();
  const provisionalMessageId = `slack_msg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const provisionalConversationId = `slack_convo_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const delegations = planSlackDelegations({
    message: normalizedMessage,
    routedAgentId,
    routeDecision,
    sourceMessageId: provisionalMessageId,
    conversationId: provisionalConversationId,
    createdAt,
  });
  const taskDispatches = planSlackTaskDispatches({
    message: normalizedMessage,
    routedAgentId,
    sourceMessageId: provisionalMessageId,
    conversationId: provisionalConversationId,
    createdAt,
  });

  let runtime:
    | {
        sessionMode: "created" | "reused";
        sessionId: string;
        runId: string;
        runStatus: "queued" | "running" | "completed" | "failed";
      }
    | {
        error: string;
      };

  try {
    runtime = await bindSlackThreadRuntime({
      message: normalizedMessage,
      routedAgentId,
      existingConversation,
    });
  } catch (error) {
    runtime = {
      error: error instanceof Error ? error.message : "Unknown runtime error.",
    };
  }

  const replyText = buildSlackAcknowledgement({
    routedAgentId,
    routeReason: routeDecision.reason,
    delegations,
    taskDispatches,
    runtime,
  });

  const dispatch = await recordSlackDispatch({
    message: normalizedMessage,
    routedAgentId,
    routeDecision,
    delegations,
    taskDispatches,
    replyText,
    runtime:
      "error" in runtime
        ? undefined
        : {
            sessionId: runtime.sessionId,
            runId: runtime.runId,
            runStatus: runtime.runStatus,
          },
  });

  await recordSlackDispatchInWorkspace(dispatch);

  try {
    await postSlackReply({
      channel: normalizedMessage.channelId,
      threadTs: normalizedMessage.threadTs,
      text: replyText,
    });
  } catch {
    // Slack reply failure should not make event handling fail. The dispatch is
    // already persisted so operators can inspect the control tower.
  }

  if (!("error" in runtime)) {
    void monitorSlackThreadRun({
      conversationId: dispatch.conversation.id,
      channelId: normalizedMessage.channelId,
      threadTs: normalizedMessage.threadTs,
      routedAgentId,
      sessionId: runtime.sessionId,
      runId: runtime.runId,
    });
  }

  return NextResponse.json({ ok: true, routedAgentId, routeDecision });
}

function shouldProcessSlackEvent(event: SlackEvent, botUserId?: string): boolean {
  if (event.type !== "app_mention" && event.type !== "message") {
    return false;
  }

  if (!event.user || !event.text?.trim()) {
    return false;
  }

  if (event.subtype || event.bot_id) {
    return false;
  }

  if (botUserId && event.user === botUserId) {
    return false;
  }

  return true;
}

function buildThreadReuseDecision(conversation: SlackConversation): RouteDecision {
  return {
    agentId: normalizeRoutedSlackAgentId(conversation.routedAgentId),
    confidence: "high",
    reason: `Reused the existing ${conversation.routedAgentId} Slack thread binding for continuity.`,
    mode: "deterministic",
  };
}

function buildApprovalRouteDecision(
  conversation: SlackConversation | null,
  intent:
    | { kind: "queue" }
    | { kind: "approve"; approvalId: string }
    | { kind: "reject"; approvalId: string }
): RouteDecision {
  if (conversation) {
    return {
      agentId: normalizeRoutedSlackAgentId(conversation.routedAgentId),
      confidence: "high",
      reason:
        intent.kind === "queue"
          ? "Handled a Slack approval queue request inside the existing thread."
          : `Handled a Slack approval ${intent.kind} action for ${intent.approvalId} inside the existing thread.`,
      mode: "deterministic",
    };
  }

  return {
    agentId: "workflow",
    confidence: "high",
    reason:
      intent.kind === "queue"
        ? "Handled a Slack approval queue request through the control surface."
        : `Handled a Slack approval ${intent.kind} action for ${intent.approvalId}.`,
    mode: "deterministic",
  };
}

function normalizeRoutedSlackAgentId(agentId: string): RoutedSlackAgentId {
  if (agentId === "docs" || agentId === "workflow" || agentId === "devops") {
    return agentId;
  }

  return "engineer";
}

interface SlackUrlVerificationPayload {
  type: "url_verification";
  challenge: string;
}

interface SlackEventCallbackPayload {
  type: "event_callback";
  event: SlackEvent;
}

type SlackIncomingPayload = SlackUrlVerificationPayload | SlackEventCallbackPayload;

interface SlackEvent {
  type: string;
  subtype?: string;
  bot_id?: string;
  user?: string;
  text?: string;
  channel: string;
  ts: string;
  thread_ts?: string;
}
