import "server-only";
import type { ConnectionStatus, GitHubActivityResponse, NormalizedGitHubActivity } from "@/types/authrix";
import type { GitHubEvent, IntegrationStatus } from "@/types/domain";
import { isGitHubConfigured } from "@/lib/auth/config";
import { getGitHubTokenVaultAccessToken, isTokenVaultConfigured } from "@/lib/auth/token-vault";
import { fetchRecentGitHubEvents } from "@/lib/github/fetcher";
import { fetchGitHubProfile } from "@/lib/github/oauth";
import { normalizeGitHubActivity } from "@/lib/github/normalizer";
import { getGitHubSession } from "@/lib/github/session";
import { getMockConnectionStatus, getMockGitHubActivity } from "@/lib/mock/github";

export async function getConnectionStatus(): Promise<ConnectionStatus> {
  // Prefer Token Vault (delegated access) over direct OAuth session
  const tokenVaultToken = await getGitHubTokenVaultAccessToken();
  if (tokenVaultToken) {
    try {
      const profile = await fetchGitHubProfile(tokenVaultToken);
      return {
        provider: "github",
        connected: true,
        source: "github",
        account: {
          login: profile.login,
          name: profile.name ?? undefined,
          avatarUrl: profile.avatar_url,
        },
        lastSyncAt: new Date().toISOString(),
        message:
          "GitHub is connected through Auth0 Token Vault. Delegated access is active.",
      };
    } catch {
      // Token Vault token failed, fall through to direct OAuth session
    }
  }

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

  // Prefer Token Vault token for GitHub API calls
  const tokenVaultToken = await getGitHubTokenVaultAccessToken();
  if (tokenVaultToken) {
    try {
      const profile = await fetchGitHubProfile(tokenVaultToken);
      const events = await fetchRecentGitHubEvents(tokenVaultToken, profile.login);
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
      // Token Vault token failed, fall through to direct OAuth session
    }
  }

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

/**
 * Get GitHub ingestion result
 * Returns the current GitHub integration status and activity
 */
export async function getGitHubIngestionResult(): Promise<{
  integration: {
    service: string;
    connected: boolean;
    status: "active" | "inactive" | "error";
    mode?: "mock" | "live" | "token-vault";
  };
  events: GitHubEvent[];
}> {
  const status = await getConnectionStatus();
  const feed = await getGitHubActivityFeed();

  // Map NormalizedGitHubActivity to GitHubEvent
  const events: GitHubEvent[] = feed.activities.map((activity) => ({
    id: activity.id,
    type: activity.kind as GitHubEvent["type"],
    repo: activity.repo,
    author: activity.actor,
    title: activity.title,
    description: activity.summary,
    url: activity.url ?? "",
    timestamp: activity.occurredAt,
    metadata: { source: activity.source },
  }));

  return {
    integration: {
      service: "github",
      connected: status.connected,
      status: status.connected ? "active" : "inactive",
      mode: status.source === "github"
        ? (isTokenVaultConfigured ? "token-vault" : "live")
        : "mock",
    },
    events,
  };
}

/**
 * Get Auth0 integration status
 * Returns the current Auth0 authentication status
 */
export function getAuth0IntegrationStatus(): IntegrationStatus {
  // Use static import to avoid async
  const isConfigured = Boolean(
    process.env.AUTH0_DOMAIN &&
      process.env.AUTH0_CLIENT_ID &&
      process.env.AUTH0_CLIENT_SECRET
  );
  return {
    service: "auth0",
    connected: isConfigured,
    status: isConfigured ? "active" : "inactive",
    mode: isConfigured ? "live" : "mock",
    description: isConfigured
      ? "Auth0 is configured and ready"
      : "Auth0 is not configured",
  };
}
