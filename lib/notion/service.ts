import type { IntegrationStatus } from "@/types/domain";

const notionEnv = {
  token: process.env.NOTION_API_TOKEN,
  parentPageId: process.env.NOTION_PARENT_PAGE_ID,
} as const;

export function isNotionConfigured(): boolean {
  return Boolean(notionEnv.token && notionEnv.parentPageId);
}

export function getNotionIntegrationStatus(): IntegrationStatus {
  if (isNotionConfigured()) {
    return {
      service: "Notion",
      connected: true,
      connectedAt: new Date().toISOString(),
      status: "active",
      mode: "live",
      description:
        "Notion documentation publishing is available through the mediated backend adapter.",
    };
  }

  return {
    service: "Notion",
    connected: false,
    status: "inactive",
    mode: "mock",
    description:
      "Notion is not configured yet. Docs updates will stay in the local generated docs store until credentials are provided.",
  };
}

export function getNotionConfig() {
  return notionEnv;
}
