import { ActivityTimelineCard } from "@/components/dashboard/activity-timeline-card";
import { PageHeader } from "@/components/ui/page-header";
import { requireSession } from "@/lib/auth/session";
import { getWorkspaceSnapshot } from "@/lib/data/workspace";

export default async function ActivityPage() {
  await requireSession("/activity");

  const snapshot = await getWorkspaceSnapshot();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity"
        description="A unified timeline of normalized engineering events and the records Authrix builds from them."
      />
      <ActivityTimelineCard entries={snapshot.timeline} />
    </div>
  );
}
