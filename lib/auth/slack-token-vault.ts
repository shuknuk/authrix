import { auth0 } from "./auth0";

const slackEnv = {
  connectionName: process.env.AUTH0_SLACK_CONNECTION_NAME,
  scopes: process.env.AUTH0_SLACK_CONNECTION_SCOPES,
};

export const isSlackTokenVaultConfigured = Boolean(slackEnv.connectionName);

export async function getSlackTokenVaultAccessToken(): Promise<string | null> {
  if (!auth0 || !slackEnv.connectionName) return null;
  try {
    const { token } = await auth0.getAccessTokenForConnection({
      connection: slackEnv.connectionName,
    });
    return token;
  } catch {
    return null;
  }
}

export function getSlackConnectionName(): string | null {
  return slackEnv.connectionName ?? null;
}

export function getSlackConnectionScopes(): string[] {
  return (slackEnv.scopes ?? "channels:read,chat:write,users:read,groups:read")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}
