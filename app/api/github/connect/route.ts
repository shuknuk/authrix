import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/client";
import { isGitHubConfigured } from "@/lib/auth/config";
import {
  buildGitHubAuthorizeUrl,
  createPkceVerifier,
  createStateToken,
} from "@/lib/github/oauth";
import { setGitHubOAuthTransaction } from "@/lib/github/session";

export async function GET(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  if (!isGitHubConfigured()) {
    return NextResponse.redirect(
      new URL("/connections?error=github-not-configured", request.url),
    );
  }

  const returnTo =
    new URL(request.url).searchParams.get("returnTo") ?? "/connections";
  const state = createStateToken();
  const codeVerifier = createPkceVerifier();

  await setGitHubOAuthTransaction({
    state,
    codeVerifier,
    returnTo,
    createdAt: new Date().toISOString(),
  });

  return NextResponse.redirect(
    buildGitHubAuthorizeUrl(request.url, state, codeVerifier),
  );
}
