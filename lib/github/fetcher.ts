import "server-only";

export interface RawGitHubEvent {
  id: string;
  type: string;
  actor?: {
    login?: string;
  };
  repo?: {
    name?: string;
  };
  payload?: {
    action?: string;
    ref_type?: string;
    ref?: string;
    commits?: Array<{
      sha?: string;
      message?: string;
      url?: string;
    }>;
    pull_request?: {
      title?: string;
      html_url?: string;
      merged?: boolean;
      state?: string;
    };
    issue?: {
      title?: string;
      html_url?: string;
      state?: string;
    };
    review?: {
      state?: string;
      html_url?: string;
    };
    release?: {
      name?: string;
      html_url?: string;
    };
  };
  created_at: string;
}

async function getGitHubJson<T>(url: string, token: string) {
  const response = await fetch(url, {
    headers: {
      Accept: "application/vnd.github+json",
      Authorization: `Bearer ${token}`,
      "User-Agent": "Authrix-Demo",
    },
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`GitHub request failed for ${url}`);
  }

  return (await response.json()) as T;
}

export async function fetchRecentGitHubEvents(token: string, login: string) {
  return getGitHubJson<RawGitHubEvent[]>(
    `https://api.github.com/users/${login}/events/public?per_page=20`,
    token,
  );
}
