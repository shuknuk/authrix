export interface SlackConfig {
  signingSecret?: string;
  botToken?: string;
  appToken?: string;
  workspaceId?: string;
  botUserId?: string;
  defaultChannelId?: string;
}

export function getSlackConfig(): SlackConfig {
  return {
    signingSecret: readStringEnv("SLACK_SIGNING_SECRET"),
    botToken: readStringEnv("SLACK_BOT_TOKEN"),
    appToken: readStringEnv("SLACK_APP_TOKEN"),
    workspaceId: readStringEnv("SLACK_WORKSPACE_ID"),
    botUserId: readStringEnv("SLACK_BOT_USER_ID"),
    defaultChannelId: readStringEnv("SLACK_DEFAULT_CHANNEL_ID"),
  };
}

export function isSlackEventsConfigured(): boolean {
  const config = getSlackConfig();
  return Boolean(config.signingSecret);
}

export function canSlackReply(): boolean {
  return Boolean(getSlackConfig().botToken);
}

export function getSlackSetupStatus() {
  const config = getSlackConfig();

  return {
    hasSigningSecret: Boolean(config.signingSecret),
    hasBotToken: Boolean(config.botToken),
    hasAppToken: Boolean(config.appToken),
    hasWorkspaceId: Boolean(config.workspaceId),
    hasBotUserId: Boolean(config.botUserId),
    hasDefaultChannelId: Boolean(config.defaultChannelId),
  };
}

function readStringEnv(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}
