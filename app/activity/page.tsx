import { ActivityTimelineCard } from "@/components/dashboard/activity-timeline-card";
import { DecisionLogCard } from "@/components/dashboard/decision-log-card";
import { MeetingArtifactsCard } from "@/components/dashboard/meeting-artifacts-card";
import { RiskAlertsCard } from "@/components/dashboard/risk-alerts-card";
import { SecurityEventsCard } from "@/components/dashboard/security-events-card";
import { SourceDocumentsCard } from "@/components/dashboard/source-documents-card";
import { PageHeader } from "@/components/ui/page-header";
import { requireSession } from "@/lib/auth/session";
import { getWorkspaceSnapshot } from "@/lib/data/workspace";
import { listSecurityEvents } from "@/lib/security/events";

export default async function ActivityPage() {
  await requireSession("/activity");

  const [snapshot, securityEvents] = await Promise.all([
    getWorkspaceSnapshot(),
    listSecurityEvents(10),
  ]);
  const driftAlerts = snapshot.riskAlerts.filter((alert) => alert.category === "drift");

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
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <MeetingArtifactsCard artifacts={snapshot.meetingArtifacts} />
        <RiskAlertsCard
          alerts={driftAlerts}
          title="Operational Drift"
          description="Docs drift, recurring open questions, and stalled approvals are surfaced here."
        />
      </div>
      <SecurityEventsCard events={securityEvents} limit={10} />
      <ActivityTimelineCard entries={snapshot.timeline} />
    </div>
  );
}
