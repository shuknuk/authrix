import type { SessionData } from "@auth0/nextjs-auth0/types";
import { redirect } from "next/navigation";
import { auth0, isAuthConfigured } from "./auth0";

export async function getOptionalSession(): Promise<SessionData | null> {
  if (!auth0) {
    return null;
  }

  return auth0.getSession();
}

export async function requireSession(
  returnTo: string
): Promise<SessionData | null> {
  if (!isAuthConfigured || !auth0) {
    return null;
  }

  const session = await auth0.getSession();
  if (!session) {
    redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  return session;
}

export async function hasAuthenticatedSession(): Promise<boolean> {
  if (!isAuthConfigured || !auth0) {
    return false;
  }

  const session = await auth0.getSession();
  return Boolean(session);
}
