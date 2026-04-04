import { CostRiskCard } from "@/components/dashboard/cost-risk-card";
import { CostSourceCard } from "@/components/dashboard/cost-source-card";
import { RiskAlertsCard } from "@/components/dashboard/risk-alerts-card";
import { MetricTile } from "@/components/ui/metric-tile";
import { PageHeader } from "@/components/ui/page-header";
import { SectionFrame } from "@/components/ui/section-frame";
import { StatusPill } from "@/components/ui/status-pill";
import { requireSession } from "@/lib/auth/session";
import { getWorkspaceSnapshot } from "@/lib/data/workspace";

export default async function CostsPage() {
  await requireSession("/costs");

  const snapshot = await getWorkspaceSnapshot();
  const operationsAlerts = snapshot.riskAlerts.filter(
    (alert) => alert.category === "operations"
  );
  const driftAlerts = snapshot.riskAlerts.filter((alert) => alert.category === "drift");
  const costPipeline = snapshot.state.pipelines.find(
    (pipeline) => pipeline.id === "devops-signals"
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Costs"
        eyebrow="Authrix Spend Review"
        description="Spend posture first, then ingestion detail and cross-signal drift."
        status={
          <>
            <StatusPill
              tone={
                snapshot.costReport.riskLevel === "high"
                  ? "danger"
                  : snapshot.costReport.riskLevel === "medium"
                    ? "warning"
                    : "success"
              }
            >
              {snapshot.costReport.riskLevel} risk
            </StatusPill>
            <StatusPill tone={operationsAlerts.length > 0 ? "warning" : "success"}>
              {operationsAlerts.length > 0 ? `${operationsAlerts.length} operations alerts` : "No operations alerts"}
            </StatusPill>
          </>
        }
      />

      <div className="grid gap-4 sm:grid-cols-4">
        <MetricTile label="Weekly spend" value={`$${snapshot.costReport.totalSpend.toFixed(2)}`} tone="accent" />
        <MetricTile label="Anomalies" value={snapshot.costReport.anomalies.length} tone={snapshot.costReport.anomalies.length > 0 ? "warning" : "success"} />
        <MetricTile label="Operations alerts" value={operationsAlerts.length} tone={operationsAlerts.length > 0 ? "warning" : "success"} />
        <MetricTile label="Drift alerts" value={driftAlerts.length} tone={driftAlerts.length > 0 ? "warning" : "success"} />
      </div>

      <SectionFrame
        title="Primary Spend Summary"
        description="The spend and risk report is the primary operator surface for this page."
      >
        <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
          <CostRiskCard report={snapshot.costReport} />
          <RiskAlertsCard
            alerts={operationsAlerts}
            title="Operations Alerts"
            description="Spend anomalies and operating signals currently affecting posture."
          />
        </div>
      </SectionFrame>

      <SectionFrame
        title="Ingestion Details"
        description="Source and pipeline posture for the current cost report."
      >
        <CostSourceCard report={snapshot.costReport} pipeline={costPipeline} />
      </SectionFrame>

      <SectionFrame
        title="Cross-signal Drift"
        description="Drift where spend trends and operational follow-through no longer match cleanly."
      >
        <RiskAlertsCard
          alerts={driftAlerts}
          title="Cost And Execution Drift"
          description="Drift detected across approvals, docs, ownership, and spend behavior."
          limit={6}
        />
      </SectionFrame>
    </div>
  );
}
