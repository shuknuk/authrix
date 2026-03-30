import { getSlackConfig, isSlackEventsConfigured } from "@/lib/slack/config";
import type { IntegrationStatus } from "@/types/domain";

export function getSlackIntegrationStatus(): IntegrationStatus {
  const config = getSlackConfig();
  const eventsConfigured = isSlackEventsConfigured();
  const connected = Boolean(eventsConfigured && config.botToken);

  return {
    service: "Slack",
    connected,
    connectedAt: connected ? new Date().toISOString() : undefined,
    scopes: ["messages", "mentions", "threads", "briefings"],
    status: connected ? "active" : eventsConfigured ? "inactive" : "inactive",
    mode: connected ? "live" : "mock",
    description: connected
      ? "Slack events, bot replies, and proactive briefings are configured for Authrix's professional messaging surface."
      : eventsConfigured
        ? "Slack event verification is configured. Add SLACK_BOT_TOKEN to enable Authrix replies."
        : "Slack is not configured yet. Phase 10 uses Slack as Authrix's first professional chat interface.",
  };
}
