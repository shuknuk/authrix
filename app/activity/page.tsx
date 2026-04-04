import { ActivityTimelineCard } from "@/components/dashboard/activity-timeline-card";
import { DecisionLogCard } from "@/components/dashboard/decision-log-card";
import { MeetingArtifactsCard } from "@/components/dashboard/meeting-artifacts-card";
import { RiskAlertsCard } from "@/components/dashboard/risk-alerts-card";
import { RuntimeRunsCard } from "@/components/dashboard/runtime-runs-card";
import { SecurityEventsCard } from "@/components/dashboard/security-events-card";
import { SourceDocumentsCard } from "@/components/dashboard/source-documents-card";
import { MetricTile } from "@/components/ui/metric-tile";
import { PageHeader } from "@/components/ui/page-header";
import { SectionFrame } from "@/components/ui/section-frame";
import { StatusPill } from "@/components/ui/status-pill";
import { requireSession } from "@/lib/auth/session";
import { getWorkspaceSnapshot } from "@/lib/data/workspace";
import { listSecurityEvents } from "@/lib/security/events";

export default async function ActivityPage() {
  await requireSession("/activity");

  const [snapshot, securityEvents] = await Promise.all([
    getWorkspaceSnapshot(),
    listSecurityEvents(8),
  ]);
  const driftAlerts = snapshot.riskAlerts.filter((alert) => alert.category === "drift");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Activity"
        eyebrow="Authrix Activity"
        description="Normalized activity and records from intake to decision history."
        status={
          <>
            <StatusPill tone="info">{snapshot.timeline.length} timeline entries</StatusPill>
            <StatusPill tone={driftAlerts.length > 0 ? "warning" : "success"}>
              {driftAlerts.length > 0 ? `${driftAlerts.length} drift alerts` : "No drift alerts"}
            </StatusPill>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <MetricTile label="Source documents" value={snapshot.sourceDocuments.length} tone="accent" />
        <MetricTile label="Artifacts" value={snapshot.meetingArtifacts.length} />
        <MetricTile label="Decisions" value={snapshot.decisionRecords.length} tone="success" />
      </div>

      <SectionFrame
        title="Primary Timeline"
        description="Use this as the primary chronological view across engineering, docs, and workflow signals."
      >
        <ActivityTimelineCard entries={snapshot.timeline} />
      </SectionFrame>

      <SectionFrame
        title="Source And Artifact Evidence"
        description="Intake records and generated artifacts that support the timeline narrative."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <SourceDocumentsCard documents={snapshot.sourceDocuments} limit={8} />
          <MeetingArtifactsCard artifacts={snapshot.meetingArtifacts} limit={6} />
        </div>
      </SectionFrame>

      <SectionFrame
        title="Decisions And Drift"
        description="Decision records and unresolved drift signals that need follow-through."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <DecisionLogCard decisions={snapshot.decisionRecords} limit={8} />
          <RiskAlertsCard
            alerts={driftAlerts}
            title="Drift Alerts"
            description="Signals where docs, approvals, ownership, or execution have started to diverge."
          />
        </div>
      </SectionFrame>

      <SectionFrame
        title="Runtime And Security"
        description="Security events and runtime activity for audit and debugging."
      >
        <div className="grid gap-4 xl:grid-cols-2">
          <SecurityEventsCard events={securityEvents} limit={8} />
          <RuntimeRunsCard />
        </div>
      </SectionFrame>
    </div>
  );
}
