import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { classifyIncomingRequest } from "@/lib/models/router";
import {
  buildSlackAcknowledgement,
  planSlackDelegations,
  planSlackTaskDispatches,
} from "@/lib/slack/operations";
import { getSlackConfig, isSlackEventsConfigured } from "@/lib/slack/config";
import { postSlackReply } from "@/lib/slack/client";
import { recordSlackDispatch } from "@/lib/slack/store";
import { recordSlackDispatchInWorkspace } from "@/lib/slack/workspace-sync";

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

  const routeDecision = await classifyIncomingRequest(normalizedMessage.text);
  const routedAgentId = routeDecision.agentId;
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
  const replyText = buildSlackAcknowledgement({
    routedAgentId,
    routeReason: routeDecision.reason,
    delegations,
    taskDispatches,
  });

  const dispatch = await recordSlackDispatch({
    message: normalizedMessage,
    routedAgentId,
    routeDecision,
    delegations,
    taskDispatches,
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
    // Slack reply failure should not make event handling fail. The dispatch is
    // already persisted so operators can inspect the control tower.
  }

  return NextResponse.json({ ok: true, routedAgentId, routeDecision });
}

function verifySlackSignature(input: {
  signingSecret: string;
  timestamp: string | null;
  signature: string | null;
  body: string;
}): boolean {
  if (!input.signingSecret || !input.timestamp || !input.signature) {
    return false;
  }

  const fiveMinutes = 60 * 5;
  const timestampAge = Math.abs(Math.floor(Date.now() / 1000) - Number(input.timestamp));
  if (!Number.isFinite(timestampAge) || timestampAge > fiveMinutes) {
    return false;
  }

  const base = `v0:${input.timestamp}:${input.body}`;
  const computed =
    "v0=" +
    crypto.createHmac("sha256", input.signingSecret).update(base, "utf8").digest("hex");

  if (computed.length !== input.signature.length) {
    return false;
  }

  return crypto.timingSafeEqual(Buffer.from(computed), Buffer.from(input.signature));
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
