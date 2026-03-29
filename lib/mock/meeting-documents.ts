import type { SourceDocument } from "@/types/domain";

export const mockMeetingDocuments: SourceDocument[] = [
  {
    id: "doc-meeting-001",
    workspaceId: "workspace-authrix",
    sourceSystem: "meeting_upload",
    documentType: "transcript",
    title: "Weekly founder sync",
    createdAt: "2026-03-27T17:30:00Z",
    participants: ["Soham", "Kinshuk"],
    content: [
      "Decision: Authrix will keep Auth0 Token Vault as the only delegated credential path for external actions.",
      "Decision: OpenClaw remains an implementation detail inside the runtime layer rather than part of the product-facing narrative.",
      "Action: Kinshuk to finish the Auth0 tenant and GitHub connected-account setup by 2026-03-31.",
      "Action: Soham to tighten the onboarding copy and setup walkthrough for the control tower by 2026-04-02.",
      "Open question: Should the first approved write create a GitHub issue or draft a documentation update?",
      "Note: The team wants the MVP to feel polished enough for real startup customers, not just hackathon judges.",
    ].join("\n"),
    transcript: [
      {
        speaker: "Kinshuk",
        text: "Decision: Authrix will keep Auth0 Token Vault as the only delegated credential path for external actions.",
        timestamp: "2026-03-27T17:31:00Z",
      },
      {
        speaker: "Soham",
        text: "Decision: OpenClaw remains an implementation detail inside the runtime layer rather than part of the product-facing narrative.",
        timestamp: "2026-03-27T17:33:00Z",
      },
      {
        speaker: "Kinshuk",
        text: "Action: Kinshuk to finish the Auth0 tenant and GitHub connected-account setup by 2026-03-31.",
        timestamp: "2026-03-27T17:35:00Z",
      },
      {
        speaker: "Soham",
        text: "Action: Soham to tighten the onboarding copy and setup walkthrough for the control tower by 2026-04-02.",
        timestamp: "2026-03-27T17:37:00Z",
      },
      {
        speaker: "Soham",
        text: "Open question: Should the first approved write create a GitHub issue or draft a documentation update?",
        timestamp: "2026-03-27T17:38:00Z",
      },
    ],
    metadata: {
      uploadKind: "manual",
      durationMinutes: 32,
      language: "en",
    },
  },
];
