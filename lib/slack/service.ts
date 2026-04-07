import { getSlackConfig, isSlackEventsConfigured } from "@/lib/slack/config";
import {
  isSlackTokenVaultConfigured,
  getSlackConnectionName,
} from "@/lib/auth/slack-token-vault";
import type { IntegrationStatus } from "@/types/domain";

export function getSlackIntegrationStatus(): IntegrationStatus {
  const config = getSlackConfig();
  const eventsConfigured = isSlackEventsConfigured();
  const tokenVaultConfigured = isSlackTokenVaultConfigured;
  const botConfigured = Boolean(eventsConfigured && config.botToken);
  const connected = tokenVaultConfigured || botConfigured;

  return {
    service: "Slack",
    connected,
    connectedAt: connected ? new Date().toISOString() : undefined,
    scopes: tokenVaultConfigured
      ? ["channels:read", "chat:write", "users:read", "groups:read"]
      : ["messages", "mentions", "threads", "briefings"],
    status: connected ? "active" : "inactive",
    mode: tokenVaultConfigured ? "token-vault" : botConfigured ? "live" : "mock",
    description: tokenVaultConfigured
      ? "Slack is connected through Auth0 Token Vault."
      : botConfigured
        ? "Slack events, bot replies, and proactive briefings are configured for Authrix's professional messaging surface."
        : "Slack is not connected. Connect via Auth0 Token Vault or set SLACK_BOT_TOKEN.",
  };
}
