import { canSlackReply, getSlackConfig } from "@/lib/slack/config";

export async function postSlackReply(input: {
  channel: string;
  text: string;
  threadTs?: string;
  blocks?: unknown[];
}): Promise<void> {
  await postSlackMessage(input);
}

export async function postSlackMessage(input: {
  channel: string;
  text: string;
  threadTs?: string;
  blocks?: unknown[];
}): Promise<void> {
  if (!canSlackReply()) {
    return;
  }

  const config = getSlackConfig();
  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.botToken}`,
      "Content-Type": "application/json; charset=utf-8",
    },
    body: JSON.stringify({
      channel: input.channel,
      text: input.text,
      thread_ts: input.threadTs,
      blocks: input.blocks,
    }),
  });

  if (!response.ok) {
    throw new Error(`Slack reply failed with ${response.status}.`);
  }

  const payload = (await response.json()) as { ok?: boolean; error?: string };
  if (!payload.ok) {
    throw new Error(payload.error ?? "Slack reply failed.");
  }
}
