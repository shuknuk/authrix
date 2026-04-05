// Auth configuration utilities
// Provides compatibility layer for task-approval-flow branch imports

import { isAuthConfigured } from "./auth0";

/**
 * Check if Auth0 is configured
 * Legacy compatibility function from task-approval-flow branch
 */
export function isAuth0Configured(): boolean {
  return isAuthConfigured;
}

/**
 * Check if GitHub integration is configured
 * Returns true if required GitHub env vars are present
 */
export function isGitHubConfigured(): boolean {
  return Boolean(
    process.env.GITHUB_OWNER ||
      process.env.AUTH0_TOKEN_VAULT_GITHUB_ACCESS_TOKEN
  );
}

/**
 * Get the GitHub OAuth callback URL
 * Constructs callback URL from request origin
 */
export function getGitHubCallbackUrl(requestUrl: string): string {
  const url = new URL(requestUrl);
  return `${url.origin}/api/github/callback`;
}
