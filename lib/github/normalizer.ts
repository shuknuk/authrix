import type { DataSource, NormalizedGitHubActivity } from "@/types/authrix";
import type { RawGitHubEvent } from "@/lib/github/fetcher";

function normalizeRepoName(name?: string) {
  return name ?? "unknown/repository";
}

export function normalizeGitHubActivity(
  events: RawGitHubEvent[],
  source: DataSource,
): NormalizedGitHubActivity[] {
  return events.flatMap<NormalizedGitHubActivity>((event) => {
    const repo = normalizeRepoName(event.repo?.name);
    const actor = event.actor?.login ?? "unknown";

    if (event.type === "PushEvent" && event.payload?.commits?.length) {
      return event.payload.commits.slice(0, 3).map((commit, index) => ({
        id: `${event.id}-commit-${index}`,
        kind: "commit" as const,
        title: commit.message ?? "Commit pushed",
        summary: `Committed to ${repo}${event.payload?.ref ? ` on ${event.payload.ref}` : ""}.`,
        repo,
        actor,
        occurredAt: event.created_at,
        url: commit.url,
        branch: event.payload?.ref,
        source,
      }));
    }

    if (event.type === "PullRequestEvent" && event.payload?.pull_request) {
      const isMerged = event.payload.pull_request.merged;
      return [
        {
          id: event.id,
          kind: "pull_request" as const,
          title: event.payload.pull_request.title ?? "Pull request update",
          summary: isMerged
            ? `Merged a pull request in ${repo}.`
            : `${event.payload?.action ?? "updated"} a pull request in ${repo}.`,
          repo,
          actor,
          occurredAt: event.created_at,
          url: event.payload.pull_request.html_url,
          status: isMerged
            ? "merged"
            : event.payload.pull_request.state ?? event.payload.action,
          source,
        },
      ];
    }

    if (event.type === "IssuesEvent" && event.payload?.issue) {
      return [
        {
          id: event.id,
          kind: "issue" as const,
          title: event.payload.issue.title ?? "Issue update",
          summary: `${event.payload.action ?? "updated"} an issue in ${repo}.`,
          repo,
          actor,
          occurredAt: event.created_at,
          url: event.payload.issue.html_url,
          status: event.payload.issue.state ?? event.payload.action,
          source,
        },
      ];
    }

    if (event.type === "PullRequestReviewEvent") {
      return [
        {
          id: event.id,
          kind: "review" as const,
          title: "Pull request review submitted",
          summary: `Reviewed a pull request in ${repo}.`,
          repo,
          actor,
          occurredAt: event.created_at,
          url: event.payload?.review?.html_url,
          status: event.payload?.review?.state ?? event.payload?.action,
          source,
        },
      ];
    }

    if (event.type === "ReleaseEvent") {
      return [
        {
          id: event.id,
          kind: "release" as const,
          title: event.payload?.release?.name ?? "Release published",
          summary: `Published a release from ${repo}.`,
          repo,
          actor,
          occurredAt: event.created_at,
          url: event.payload?.release?.html_url,
          status: event.payload?.action ?? "published",
          source,
        },
      ];
    }

    if (event.type === "CreateEvent" && event.payload?.ref_type === "branch") {
      return [
        {
          id: event.id,
          kind: "branch" as const,
          title: `Created branch ${event.payload.ref ?? "new-branch"}`,
          summary: `Created a new branch in ${repo}.`,
          repo,
          actor,
          occurredAt: event.created_at,
          branch: event.payload.ref,
          status: "created",
          source,
        },
      ];
    }

    return [];
  });
}
