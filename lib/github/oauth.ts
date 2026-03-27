import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { getGitHubCallbackUrl } from "@/lib/auth/config";

export interface GitHubProfile {
  login: string;
  name?: string | null;
  avatar_url?: string;
}

export interface GitHubToken {
  access_token: string;
  scope?: string;
  token_type?: string;
}

export function createPkceVerifier() {
  return randomBytes(32).toString("base64url");
}

export function createStateToken() {
  return randomBytes(24).toString("base64url");
}

export function createCodeChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function buildGitHubAuthorizeUrl(requestUrl: string, state: string, verifier: string) {
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", process.env.GITHUB_CLIENT_ID ?? "");
  url.searchParams.set("redirect_uri", getGitHubCallbackUrl(requestUrl));
  url.searchParams.set("scope", "read:user repo");
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", createCodeChallenge(verifier));
  url.searchParams.set("code_challenge_method", "S256");
  url.searchParams.set("prompt", "select_account");
  return url.toString();
}

export async function exchangeCodeForToken({
  code,
  codeVerifier,
  requestUrl,
}: {
  code: string;
  codeVerifier: string;
  requestUrl: string;
}): Promise<GitHubToken> {
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: getGitHubCallbackUrl(requestUrl),
      code_verifier: codeVerifier,
    }),
    cache: "no-store",
  });

  const payload = (await response.json()) as GitHubToken & {
    access_token?: string;
    scope?: string;
    token_type?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || !payload.access_token) {
    throw new Error(payload.error_description ?? payload.error ?? "GitHub token exchange failed");
  }

  return {
    access_token: payload.access_token,
    scope: payload.scope,
    token_type: payload.token_type,
  };
}

export async function fetchGitHubProfile(token: string) {
  const response = await fetch("https://api.github.com/user", {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "Authrix-Demo",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error("GitHub profile request failed");
  }

  return (await response.json()) as GitHubProfile;
}
