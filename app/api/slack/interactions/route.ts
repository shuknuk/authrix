import { NextResponse } from "next/server";
import { resolveSlackApprovalAction } from "@/lib/slack/approvals";
import { canSlackReply, getSlackConfig, isSlackEventsConfigured } from "@/lib/slack/config";
import { postSlackReply } from "@/lib/slack/client";
import { verifySlackSignature } from "@/lib/slack/signature";
import {
  appendSlackReplyMessage,
  findSlackConversationByThread,
} from "@/lib/slack/store";

export async function POST(request: Request) {
  if (!isSlackEventsConfigured()) {
    return NextResponse.json(
      { error: "Slack interactions are not configured for this Authrix environment." },
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

  const form = new URLSearchParams(body);
  const rawPayload = form.get("payload");
  if (!rawPayload) {
    return NextResponse.json({ error: "Slack interaction payload is required." }, { status: 400 });
  }

  const payload = JSON.parse(rawPayload) as SlackInteractionPayload;
  if (payload.type !== "block_actions") {
    return NextResponse.json({ ok: true, ignored: true });
  }

  const action = payload.actions?.[0];
  if (!action || (action.action_id !== "approval.approve" && action.action_id !== "approval.reject")) {
    return NextResponse.json({ ok: true, ignored: true });
  }

  if (!action.value) {
    return NextResponse.json({ error: "Approval id is required." }, { status: 400 });
  }

  const threadTs =
    payload.message?.thread_ts ??
    payload.message?.ts ??
    payload.container?.thread_ts ??
    payload.container?.message_ts;
  const channelId = payload.channel?.id ?? payload.container?.channel_id;
  const actor = payload.user?.username ?? payload.user?.name ?? payload.user?.id ?? "slack-user";
  const replyText = await resolveSlackApprovalAction({
    approvalId: action.value,
    status: action.action_id === "approval.approve" ? "approved" : "rejected",
    actor,
  });

  if (channelId && threadTs) {
    const conversation = await findSlackConversationByThread({
      channelId,
      threadTs,
    });

    if (conversation) {
      await appendSlackReplyMessage({
        conversationId: conversation.id,
        text: replyText,
        agentId: "workflow",
      });
    }

    if (canSlackReply()) {
      try {
        await postSlackReply({
          channel: channelId,
          threadTs,
          text: replyText,
        });
      } catch {
        // The interaction result is already stored locally when the thread exists.
      }
    }
  }

  return NextResponse.json({ ok: true, replyText });
}

interface SlackInteractionPayload {
  type: string;
  user?: {
    id?: string;
    name?: string;
    username?: string;
  };
  channel?: {
    id?: string;
  };
  container?: {
    channel_id?: string;
    message_ts?: string;
    thread_ts?: string;
  };
  message?: {
    ts?: string;
    thread_ts?: string;
  };
  actions?: Array<{
    action_id?: string;
    value?: string;
  }>;
}
