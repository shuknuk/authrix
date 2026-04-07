import "server-only";

export interface GitHubCostData {
  totalSpend: number;
  currency: string;
  breakdown: {
    category: string;
    amount: number;
    change: number;
    trend: "up" | "down" | "stable";
  }[];
  period: {
    start: string;
    end: string;
  };
}

interface GitHubActionsUsage {
  total_ms: number;
  billable: {
    UBUNTU: number;
    WINDOWS: number;
    MACOS: number;
  };
}

/**
 * Check if GitHub Actions billing can be fetched
 * Requires GitHub token with appropriate scopes
 */
export async function fetchGitHubActionsCost(
  accessToken: string,
  owner: string
): Promise<GitHubCostData | null> {
  try {
    // Calculate period (last 7 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);

    // Note: GitHub's Actions billing API is limited
    // This fetches workflow runs and estimates costs
    const response = await fetch(
      `https://api.github.com/repos/${owner}/actions/runs?created=>${start.toISOString().split("T")[0]}&per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
        next: { revalidate: 3600 },
      }
    );

    if (!response.ok) {
      console.warn("GitHub Actions API returned non-OK response:", response.status);
      return null;
    }

    const data = await response.json() as {
      workflow_runs: {
        id: number;
        name: string;
        run_started_at: string;
        updated_at: string;
        run_duration_ms?: number;
      }[];
    };

    // Estimate costs based on run duration
    // GitHub Actions pricing: $0.008/minute for Linux, $0.016/minute for Windows, $0.08/minute for macOS
    let totalMinutes = 0;
    const runs = data.workflow_runs || [];

    for (const run of runs) {
      if (run.run_duration_ms) {
        totalMinutes += run.run_duration_ms / (1000 * 60);
      }
    }

    const estimatedCost = totalMinutes * 0.008; // Assume Linux (cheapest)

    return {
      totalSpend: estimatedCost,
      currency: "USD",
      breakdown: [
        {
          category: "GitHub Actions",
          amount: estimatedCost,
          change: 0,
          trend: "stable",
        },
      ],
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
    };
  } catch (error) {
    console.error("Failed to fetch GitHub Actions cost data:", error);
    return null;
  }
}

/**
 * Get GitHub Actions cost connection status
 */
export function getGitHubActionsConnectionStatus(hasGitHubToken: boolean): {
  configured: boolean;
  message: string;
} {
  if (!hasGitHubToken) {
    return {
      configured: false,
      message: "GitHub OAuth not connected. Connect GitHub to enable Actions usage tracking.",
    };
  }

  return {
    configured: true,
    message: "GitHub Actions usage tracking available via connected account.",
  };
}
