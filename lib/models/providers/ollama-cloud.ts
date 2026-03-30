import { getOllamaCloudConfig } from "@/lib/models/config";
import type { ModelProvider, ModelProviderChatRequest, ModelProviderChatResponse } from "@/types/models";

export function createOllamaCloudProvider(): ModelProvider {
  const config = getOllamaCloudConfig();

  return {
    provider: "ollama-cloud",
    configured: Boolean(config.apiKey && config.baseUrl),
    async chat(request: ModelProviderChatRequest): Promise<ModelProviderChatResponse> {
      if (!config.apiKey) {
        throw new Error("OLLAMA_API_KEY is not configured.");
      }

      const response = await fetch(`${config.baseUrl}/chat`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json; charset=utf-8",
        },
        body: JSON.stringify({
          model: request.model,
          messages: request.messages,
          stream: false,
          format: request.format,
          options:
            typeof request.temperature === "number"
              ? { temperature: request.temperature }
              : undefined,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Ollama Cloud chat failed with ${response.status}. ${text}`.trim());
      }

      const payload = (await response.json()) as {
        model?: string;
        message?: { content?: string };
      };

      return {
        model: payload.model ?? request.model,
        content: payload.message?.content ?? "",
        raw: payload,
      };
    },
  };
}
