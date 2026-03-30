import { routeSlackMessageToAgent as routeDeterministically } from "@/lib/slack/router";
import { resolveRouterExecutionMode } from "@/lib/models/config";
import { getModelProvider } from "@/lib/models/provider";
import { getRouterModel } from "@/lib/models/registry";
import type { RouteDecision, RoutedAgentId } from "@/types/models";

const ALLOWED_AGENT_IDS = new Set<RoutedAgentId>(["engineer", "docs", "workflow", "devops"]);

export async function classifyIncomingRequest(text: string): Promise<RouteDecision> {
  const provider = getModelProvider();
  const routerMode = resolveRouterExecutionMode();
  const fallbackAgentId = routeDeterministically(text);

  if (routerMode === "local" || !provider.configured) {
    return {
      agentId: normalizeAgentId(fallbackAgentId),
      confidence: "medium",
      reason: "Used deterministic keyword routing.",
      mode: "deterministic",
    };
  }

  try {
    const model = getRouterModel();
    const result = await provider.chat({
      model,
      format: "json",
      temperature: 0.1,
      messages: [
        {
          role: "system",
          content:
            'Classify the request to one Authrix agent. Return JSON only with keys: "agentId", "confidence", and "reason". Allowed agentId values: engineer, docs, workflow, devops.',
        },
        {
          role: "user",
          content: text,
        },
      ],
    });

    const parsed = JSON.parse(result.content) as Partial<RouteDecision>;
    if (parsed.agentId && ALLOWED_AGENT_IDS.has(parsed.agentId as RoutedAgentId)) {
      return {
        agentId: parsed.agentId as RoutedAgentId,
        confidence:
          parsed.confidence === "high" || parsed.confidence === "low"
            ? parsed.confidence
            : "medium",
        reason: parsed.reason?.trim() || "Used model-based routing.",
        mode: "model",
        model,
      };
    }
  } catch {
    if (routerMode === "model") {
      // Intentional silent fallback. Operators still see provider posture in the UI.
    }
  }

  return {
    agentId: normalizeAgentId(fallbackAgentId),
    confidence: "medium",
    reason: "Used deterministic fallback routing after model classification was unavailable.",
    mode: "deterministic",
  };
}

function normalizeAgentId(agentId: string): RoutedAgentId {
  if (agentId === "docs" || agentId === "workflow" || agentId === "devops") {
    return agentId;
  }

  return "engineer";
}
