import { auth0 } from "./auth0";

const tokenVaultEnv = {
  githubConnection: process.env.AUTH0_GITHUB_CONNECTION_NAME,
  githubAccessToken: process.env.AUTH0_TOKEN_VAULT_GITHUB_ACCESS_TOKEN,
  githubScopes: process.env.AUTH0_GITHUB_CONNECTION_SCOPES,
} as const;

export const isTokenVaultConfigured = Boolean(tokenVaultEnv.githubConnection);

export async function getGitHubTokenVaultAccessToken(): Promise<string | null> {
  if (auth0 && tokenVaultEnv.githubConnection) {
    try {
      const { token } = await auth0.getAccessTokenForConnection({
        connection: tokenVaultEnv.githubConnection,
      });

      return token;
    } catch {
      // Fall back below so local development can still use a manual override token.
    }
  }

  return tokenVaultEnv.githubAccessToken ?? null;
}

export function getGitHubConnectionName(): string | null {
  return tokenVaultEnv.githubConnection ?? null;
}

export function getGitHubConnectionScopes(): string[] {
  return (tokenVaultEnv.githubScopes ?? "repo,read:org")
    .split(",")
    .map((scope) => scope.trim())
    .filter(Boolean);
}
