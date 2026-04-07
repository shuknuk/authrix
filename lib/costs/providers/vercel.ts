import "server-only";

export interface VercelCostData {
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

interface VercelProject {
  id: string;
  name: string;
}

interface VercelDeployment {
  id: string;
  createdAt: number;
  projectId: string;
}

/**
 * Check if Vercel API is configured
 */
export function isVercelConfigured(): boolean {
  return Boolean(process.env.VERCEL_API_TOKEN);
}

/**
 * Fetch Vercel cost data from the Vercel API
 * Note: Vercel doesn't have a dedicated cost API endpoint.
 * This uses deployment data to estimate usage patterns.
 */
export async function fetchVercelCostData(): Promise<VercelCostData | null> {
  const token = process.env.VERCEL_API_TOKEN;

  if (!token) {
    return null;
  }

  try {
    // Fetch projects to get deployment activity
    const projectsResponse = await fetch("https://api.vercel.com/v9/projects", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      next: { revalidate: 3600 }, // Cache for 1 hour
    });

    if (!projectsResponse.ok) {
      console.warn("Vercel API returned non-OK response:", projectsResponse.status);
      return null;
    }

    const projectsData = await projectsResponse.json() as { projects: VercelProject[] };
    const projects = projectsData.projects || [];

    // Calculate period (last 7 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);

    // Estimate costs based on deployment activity
    // Note: This is an estimation. Real billing requires Vercel's billing API access
    let estimatedBuildMinutes = 0;
    let deploymentCount = 0;

    for (const project of projects.slice(0, 5)) { // Limit to first 5 projects
      try {
        const deploymentsResponse = await fetch(
          `https://api.vercel.com/v6/deployments?projectId=${project.id}&since=${start.getTime()}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
            next: { revalidate: 3600 },
          }
        );

        if (deploymentsResponse.ok) {
          const deploymentsData = await deploymentsResponse.json() as { deployments: VercelDeployment[] };
          const deployments = deploymentsData.deployments || [];
          deploymentCount += deployments.length;
          // Rough estimate: 2 minutes per deployment
          estimatedBuildMinutes += deployments.length * 2;
        }
      } catch (error) {
        console.warn(`Failed to fetch deployments for project ${project.name}:`, error);
      }
    }

    // Estimate costs (based on Vercel Pro plan rates - $0.40 per GB for bandwidth, $0.02 per build minute)
    // This is illustrative - real implementation needs billing API access
    const estimatedBuildCost = estimatedBuildMinutes * 0.02;
    const estimatedBandwidthCost = deploymentCount * 0.5; // Rough estimate

    return {
      totalSpend: estimatedBuildCost + estimatedBandwidthCost,
      currency: "USD",
      breakdown: [
        {
          category: "Build Minutes",
          amount: estimatedBuildCost,
          change: 0,
          trend: "stable",
        },
        {
          category: "Bandwidth",
          amount: estimatedBandwidthCost,
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
    console.error("Failed to fetch Vercel cost data:", error);
    return null;
  }
}

/**
 * Get Vercel connection status
 */
export function getVercelConnectionStatus(): {
  configured: boolean;
  message: string;
} {
  if (!isVercelConfigured()) {
    return {
      configured: false,
      message: "Vercel API token not configured. Add VERCEL_API_TOKEN to enable live cost data.",
    };
  }

  return {
    configured: true,
    message: "Vercel API is configured and ready.",
  };
}
