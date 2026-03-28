import type { IntegrationStatus } from "@/types/domain";

export const mockIntegrations: IntegrationStatus[] = [
  {
    service: "GitHub",
    connected: true,
    connectedAt: "2026-03-20T10:00:00Z",
    scopes: ["repo", "read:org"],
    status: "active",
  },
  {
    service: "Vercel",
    connected: false,
    status: "inactive",
  },
  {
    service: "Supabase",
    connected: false,
    status: "inactive",
  },
  {
    service: "Slack",
    connected: false,
    status: "inactive",
  },
];
