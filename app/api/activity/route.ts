import { NextResponse } from "next/server";
import { mockGitHubEvents, normalizeGitHubEvents } from "@/lib/mock/github-activity";
import type { TimelineEntry } from "@/types/domain";

export async function GET() {
  const activities = normalizeGitHubEvents(mockGitHubEvents);

  const timeline: TimelineEntry[] = activities.map((a) => ({
    id: `timeline-${a.id}`,
    type: a.eventType,
    title: a.title,
    description: a.summary,
    source: a.source,
    timestamp: a.timestamp,
    metadata: {
      repo: a.repo,
      author: a.author,
      impact: a.impact,
    },
  }));

  // Sort newest first
  timeline.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return NextResponse.json(timeline);
}
