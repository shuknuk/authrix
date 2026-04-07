import type { SessionData } from "@auth0/nextjs-auth0/types";
import { redirect } from "next/navigation";
import { auth0, isAuthConfigured } from "./auth0";

export async function getOptionalSession(): Promise<SessionData | null> {
  if (!auth0) {
    return null;
  }

  try {
    return await auth0.getSession();
  } catch {
    // Session decryption failures (e.g. invalid secret, corrupted cookie)
    // should not crash the layout. Treat as "no session".
    return null;
  }
}

export async function requireSession(
  returnTo: string
): Promise<SessionData | null> {
  if (!isAuthConfigured || !auth0) {
    return null;
  }

  try {
    const session = await auth0.getSession();
    if (!session) {
      redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
    }
    return session;
  } catch (error) {
    // If the redirect itself throws, let it propagate — Next.js handles it.
    // For other errors (e.g. session decryption), redirect to login.
    if (error instanceof Error && error.message === "NEXT_REDIRECT") {
      throw error;
    }
    redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  }
}

export async function hasAuthenticatedSession(): Promise<boolean> {
  if (!isAuthConfigured || !auth0) {
    return false;
  }

  const session = await auth0.getSession();
  return Boolean(session);
}
