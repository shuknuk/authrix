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

/**
 * Returns the current session, or redirects to login if there is none.
 *
 * IMPORTANT: On protected routes, middleware handles the redirect before
 * the page component renders. This function exists as a safety net for
 * edge cases where middleware doesn't run (e.g. static previews).
 */
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
    // If auth0.getSession() fails for any reason other than redirect,
    // redirect to login. For redirect errors, re-throw so Next.js handles it.
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
