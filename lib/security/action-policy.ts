import type { ActionPolicy } from "@/types/security";

const ACTION_POLICIES: Record<string, ActionPolicy> = {
  "github.issue.create": {
    actionKind: "github.issue.create",
    label: "GitHub issue creation",
    executionTier: "external-write",
    requiresApproval: true,
    backendMediated: true,
    description:
      "Creates a tracked follow-up issue through the mediated GitHub backend adapter.",
  },
  "docs.update": {
    actionKind: "docs.update",
    label: "Documentation update",
    executionTier: "external-write",
    requiresApproval: true,
    backendMediated: true,
    description:
      "Publishes or records documentation updates through a controlled docs adapter.",
  },
};

export function getActionPolicy(actionKind: string): ActionPolicy {
  return (
    ACTION_POLICIES[actionKind] ?? {
      actionKind,
      label: actionKind,
      executionTier: "host-level",
      requiresApproval: true,
      backendMediated: false,
      description:
        "No explicit action policy is registered for this action kind yet.",
    }
  );
}
