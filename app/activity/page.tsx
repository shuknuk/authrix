import { ActivityTimelineCard } from "@/components/dashboard/activity-timeline-card";
import { PageHeader } from "@/components/ui/page-header";
import { getTimelineEntries } from "@/lib/data/workspace";

export default async function ActivityPage() {
  const timeline = await getTimelineEntries();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Activity"
        description="A unified timeline of normalized engineering events and the records Authrix builds from them."
      />
      <ActivityTimelineCard entries={timeline} />
    </div>
  );
}
