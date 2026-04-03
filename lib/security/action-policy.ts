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
  "github.branch.push": {
    actionKind: "github.branch.push",
    label: "GitHub branch push",
    executionTier: "external-write",
    requiresApproval: true,
    backendMediated: true,
    description:
      "Pushes a prepared local engineering branch to GitHub through the mediated backend adapter.",
  },
  "github.pull_request.create": {
    actionKind: "github.pull_request.create",
    label: "GitHub draft pull request",
    executionTier: "external-write",
    requiresApproval: true,
    backendMediated: true,
    description:
      "Pushes a prepared engineering branch and opens a draft pull request through the mediated GitHub backend adapter.",
  },
  "github.pull_request.comment": {
    actionKind: "github.pull_request.comment",
    label: "GitHub pull request comment",
    executionTier: "external-write",
    requiresApproval: true,
    backendMediated: true,
    description:
      "Posts a comment on an existing GitHub pull request through the mediated backend adapter.",
  },
  "github.pull_request.merge": {
    actionKind: "github.pull_request.merge",
    label: "GitHub pull request merge",
    executionTier: "external-write",
    requiresApproval: true,
    backendMediated: true,
    description:
      "Merges an approved GitHub pull request through the mediated backend adapter.",
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
