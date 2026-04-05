import { ActivityTimelineCard } from "@/components/dashboard/activity-timeline-card";
import { AgentHandoffsCard } from "@/components/dashboard/agent-handoffs-card";
import { DelegationHistoryCard } from "@/components/dashboard/delegation-history-card";
import { DecisionLogCard } from "@/components/dashboard/decision-log-card";
import { DocsAudioPipelineCard } from "@/components/dashboard/docs-audio-pipeline-card";
import { EngineerExecutionsCard } from "@/components/dashboard/engineer-executions-card";
import { MeetingArtifactsCard } from "@/components/dashboard/meeting-artifacts-card";
import { RiskAlertsCard } from "@/components/dashboard/risk-alerts-card";
import { RuntimeRunsCard } from "@/components/dashboard/runtime-runs-card";
import { RuntimeSessionsCard } from "@/components/dashboard/runtime-sessions-card";
import { ScheduledBriefingsCard } from "@/components/dashboard/scheduled-briefings-card";
import { SecurityEventsCard } from "@/components/dashboard/security-events-card";
import { SlackMessageHistoryCard } from "@/components/dashboard/slack-message-history-card";
import { SourceDocumentsCard } from "@/components/dashboard/source-documents-card";
import { WorkspaceMemoryCard } from "@/components/dashboard/workspace-memory-card";
import { PageHeader } from "@/components/ui/page-header";
import { requireSession } from "@/lib/auth/session";
import { getWorkspaceSnapshot } from "@/lib/data/workspace";
import { getAudioTranscriptionStatus } from "@/lib/docs/audio";
import { listEngineerExecutionRecords } from "@/lib/engineer/store";
import { listAuthrixRuntimeRuns, listAuthrixRuntimeSessions } from "@/lib/runtime/service";
import { listSecurityEvents } from "@/lib/security/events";
import { loadSlackWorkspaceState } from "@/lib/slack/store";

export default async function ActivityPage() {
  await requireSession("/activity");

  const [
    snapshot,
    securityEvents,
    slackState,
    runtimeSessions,
    runtimeRuns,
    engineerExecutions,
    audioStatus,
  ] = await Promise.all([
    getWorkspaceSnapshot(),
    listSecurityEvents(10),
    loadSlackWorkspaceState(),
    listAuthrixRuntimeSessions(8),
    listAuthrixRuntimeRuns(8),
    listEngineerExecutionRecords(6),
    Promise.resolve(getAudioTranscriptionStatus()),
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
        <DocsAudioPipelineCard
          status={audioStatus}
          documents={snapshot.sourceDocuments}
        />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <DecisionLogCard decisions={snapshot.decisionRecords} />
        <MeetingArtifactsCard artifacts={snapshot.meetingArtifacts} />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RiskAlertsCard
          alerts={driftAlerts}
          title="Operational Drift"
          description="Docs drift, recurring open questions, and stalled approvals are surfaced here."
        />
        <DelegationHistoryCard delegations={slackState.delegations} />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <ScheduledBriefingsCard
          schedules={slackState.briefingSchedules}
          briefings={slackState.briefings}
        />
        <RuntimeSessionsCard sessions={runtimeSessions} limit={8} />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <RuntimeRunsCard runs={runtimeRuns} limit={8} />
        <EngineerExecutionsCard executions={engineerExecutions} limit={6} />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <WorkspaceMemoryCard memories={snapshot.memories} limit={6} />
        <AgentHandoffsCard handoffs={snapshot.handoffs} limit={6} />
      </div>
      <SlackMessageHistoryCard messages={slackState.messages} />
      <SecurityEventsCard events={securityEvents} limit={10} />
      <ActivityTimelineCard entries={snapshot.timeline} />
    </div>
  );
}
