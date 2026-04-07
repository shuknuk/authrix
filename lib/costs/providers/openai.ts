import "server-only";

export interface OpenAICostData {
  totalSpend: number;
  currency: string;
  breakdown: {
    model: string;
    amount: number;
    tokens: number;
    change: number;
    trend: "up" | "down" | "stable";
  }[];
  period: {
    start: string;
    end: string;
  };
  anomalies: {
    model: string;
    description: string;
    severity: "low" | "medium" | "high";
  }[];
}

interface OpenAIUsageResponse {
  object: string;
  data: {
    object: string;
    organization_id: string;
    organization_name: string;
    aggregation_timestamp: number;
    n_requests: number;
    n_tokens: number;
    n_context_tokens: number;
    n_generated_tokens: number;
  }[];
}

/**
 * Check if OpenAI API is configured
 */
export function isOpenAIConfigured(): boolean {
  return Boolean(process.env.OPENAI_API_KEY);
}

/**
 * Fetch OpenAI usage data from the OpenAI API
 * Note: Requires organization-level API key with usage access
 */
export async function fetchOpenAIUsageData(): Promise<OpenAICostData | null> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return null;
  }

  try {
    // Calculate period (last 7 days)
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - 7);

    // OpenAI usage API endpoint (requires organization admin access)
    const response = await fetch(
      `https://api.openai.com/v1/organization/usage?start_time=${Math.floor(start.getTime() / 1000)}&end_time=${Math.floor(end.getTime() / 1000)}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    );

    // If we get a 403 or the org endpoint isn't available, try the completions endpoint
    // as a fallback to detect if the key works
    if (response.status === 403 || response.status === 404) {
      // Try a simple models list to verify key works
      const modelsResponse = await fetch("https://api.openai.com/v1/models", {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        next: { revalidate: 3600 },
      });

      if (modelsResponse.ok) {
        // Key works but we don't have usage access
        // Return a placeholder indicating the key is valid
        return {
          totalSpend: 0,
          currency: "USD",
          breakdown: [],
          period: {
            start: start.toISOString(),
            end: end.toISOString(),
          },
          anomalies: [
            {
              model: "N/A",
              description: "OpenAI API key is valid but organization usage API requires admin access. Cost tracking is limited.",
              severity: "low",
            },
          ],
        };
      }

      return null;
    }

    if (!response.ok) {
      console.warn("OpenAI API returned non-OK response:", response.status);
      return null;
    }

    const data = await response.json() as OpenAIUsageResponse;

    // Calculate totals and build breakdown
    const modelBreakdown: Map<string, { tokens: number; requests: number }> = new Map();
    let totalTokens = 0;

    for (const entry of data.data || []) {
      totalTokens += entry.n_tokens;
      // Group by model (OpenAI doesn't always return model in this endpoint)
      const model = "gpt-4"; // Default grouping
      const existing = modelBreakdown.get(model) || { tokens: 0, requests: 0 };
      existing.tokens += entry.n_tokens;
      existing.requests += entry.n_requests;
      modelBreakdown.set(model, existing);
    }

    // Estimate costs (based on GPT-4 pricing: $0.03 per 1K tokens input, $0.06 per 1K output)
    // This is illustrative - real implementation needs billing API access
    const estimatedCostPer1k = 0.045; // Average blended rate
    const breakdown = Array.from(modelBreakdown.entries()).map(([model, stats]) => {
      const amount = (stats.tokens / 1000) * estimatedCostPer1k;
      return {
        model,
        amount,
        tokens: stats.tokens,
        change: 0, // Would need historical data
        trend: "stable" as const,
      };
    });

    const totalSpend = breakdown.reduce((sum, item) => sum + item.amount, 0);

    // Detect anomalies
    const anomalies: OpenAICostData["anomalies"] = [];
    const highUsageModel = breakdown.find((item) => item.tokens > 1000000);
    if (highUsageModel) {
      anomalies.push({
        model: highUsageModel.model,
        description: `High token usage detected: ${highUsageModel.tokens.toLocaleString()} tokens`,
        severity: "medium",
      });
    }

    return {
      totalSpend,
      currency: "USD",
      breakdown,
      period: {
        start: start.toISOString(),
        end: end.toISOString(),
      },
      anomalies,
    };
  } catch (error) {
    console.error("Failed to fetch OpenAI usage data:", error);
    return null;
  }
}

/**
 * Get OpenAI connection status
 */
export function getOpenAIConnectionStatus(): {
  configured: boolean;
  message: string;
} {
  if (!isOpenAIConfigured()) {
    return {
      configured: false,
      message: "OpenAI API key not configured. Add OPENAI_API_KEY to enable usage tracking.",
    };
  }

  return {
    configured: true,
    message: "OpenAI API is configured.",
  };
}
