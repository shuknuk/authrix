import { ActivityTimelineCard } from "@/components/dashboard/activity-timeline-card";
import { DecisionLogCard } from "@/components/dashboard/decision-log-card";
import { MeetingArtifactsCard } from "@/components/dashboard/meeting-artifacts-card";
import { SourceDocumentsCard } from "@/components/dashboard/source-documents-card";
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
        description="A unified view of source intake, meeting intelligence, durable decisions, and the records Authrix builds from them."
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <SourceDocumentsCard documents={snapshot.sourceDocuments} />
        <DecisionLogCard decisions={snapshot.decisionRecords} />
      </div>
      <MeetingArtifactsCard artifacts={snapshot.meetingArtifacts} />
      <ActivityTimelineCard entries={snapshot.timeline} />
    </div>
  );
}
