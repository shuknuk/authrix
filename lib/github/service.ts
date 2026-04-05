import "server-only";
import type { ConnectionStatus, GitHubActivityResponse } from "@/types/authrix";
import { isGitHubConfigured } from "@/lib/auth/config";
import { fetchRecentGitHubEvents } from "@/lib/github/fetcher";
import { fetchGitHubProfile } from "@/lib/github/oauth";
import { normalizeGitHubActivity } from "@/lib/github/normalizer";
import { getGitHubSession } from "@/lib/github/session";
import { getMockConnectionStatus, getMockGitHubActivity } from "@/lib/mock/github";

export async function getConnectionStatus(): Promise<ConnectionStatus> {
  if (!isGitHubConfigured()) {
    return {
      provider: "github",
      connected: false,
      source: "unconfigured",
      message:
        "GitHub OAuth is not configured yet. Add the GitHub client ID and secret to enable live connections.",
    };
  }

  const session = await getGitHubSession();

  if (!session?.accessToken) {
    return getMockConnectionStatus();
  }

  try {
    const profile = await fetchGitHubProfile(session.accessToken);

    return {
      provider: "github",
      connected: true,
      source: "github",
      account: {
        login: profile.login,
        name: profile.name ?? undefined,
        avatarUrl: profile.avatar_url,
      },
      scope: session.scope,
      lastSyncAt: session.connectedAt,
      message:
        "GitHub is connected through a server-side session. Authrix will use live public activity when it is available.",
    };
  } catch {
    return {
      provider: "github",
      connected: false,
      source: "mock",
      message:
        "GitHub was previously connected, but the session could not be validated. Authrix is showing mock activity until the account reconnects.",
    };
  }
}

export async function getGitHubActivityFeed(): Promise<GitHubActivityResponse> {
  const fetchedAt = new Date().toISOString();

  if (!isGitHubConfigured()) {
    return {
      connected: false,
      source: "mock",
      fetchedAt,
      activities: getMockGitHubActivity(),
    };
  }

  const session = await getGitHubSession();

  if (!session?.accessToken) {
    return {
      connected: false,
      source: "mock",
      fetchedAt,
      activities: getMockGitHubActivity(),
    };
  }

  try {
    const login =
      session.login ?? (await fetchGitHubProfile(session.accessToken)).login;
    const events = await fetchRecentGitHubEvents(session.accessToken, login);
    const normalized = normalizeGitHubActivity(events, "github");

    if (normalized.length >= 3) {
      return {
        connected: true,
        source: "github",
        fetchedAt,
        activities: normalized,
      };
    }

    return {
      connected: true,
      source: "mock",
      fetchedAt,
      activities: getMockGitHubActivity(),
    };
  } catch {
    return {
      connected: true,
      source: "mock",
      fetchedAt,
      activities: getMockGitHubActivity(),
    };
  }
}
