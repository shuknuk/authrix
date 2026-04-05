import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/client";
import { exchangeCodeForToken, fetchGitHubProfile } from "@/lib/github/oauth";
import {
  clearGitHubOAuthTransaction,
  setGitHubSession,
  getGitHubOAuthTransaction,
} from "@/lib/github/session";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const session = await getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  const transaction = await getGitHubOAuthTransaction();

  if (!transaction) {
    return NextResponse.redirect(
      new URL("/connections?error=missing-github-oauth-state", request.url),
    );
  }

  try {
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");

    if (!code || !state || state !== transaction.state) {
      throw new Error("github-state-mismatch");
    }

    const token = await exchangeCodeForToken({
      code,
      codeVerifier: transaction.codeVerifier,
      requestUrl: request.url,
    });
    const profile = await fetchGitHubProfile(token.access_token);

    await setGitHubSession({
      accessToken: token.access_token,
      scope: token.scope,
      tokenType: token.token_type,
      login: profile.login,
      connectedAt: new Date().toISOString(),
    });
    await clearGitHubOAuthTransaction();

    return NextResponse.redirect(
      new URL(`${transaction.returnTo}?connected=1`, request.url),
    );
  } catch {
    await clearGitHubOAuthTransaction();

    return NextResponse.redirect(
      new URL("/connections?error=github-callback-failed", request.url),
    );
  }
}
