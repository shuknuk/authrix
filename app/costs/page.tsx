import { CostSourceCard } from "@/components/dashboard/cost-source-card";
import { CostRiskCard } from "@/components/dashboard/cost-risk-card";
import { RiskAlertsCard } from "@/components/dashboard/risk-alerts-card";
import { PageHeader } from "@/components/ui/page-header";
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
    <div className="space-y-6">
      <PageHeader
        title="Costs"
        description="Spend visibility, ingestion state, anomaly detection, and operational risk framing for the systems Authrix monitors."
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <CostSourceCard report={snapshot.costReport} pipeline={costPipeline} />
        <RiskAlertsCard
          alerts={operationsAlerts}
          title="Operations Alerts"
          description="Anomaly and spend-risk signals currently affecting the workspace."
        />
      </div>
      <RiskAlertsCard
        alerts={driftAlerts}
        title="Cost And Execution Drift"
        description="Cross-signal drift where spend, approvals, docs, or ownership are no longer lining up cleanly."
        limit={3}
      />
      <CostRiskCard report={snapshot.costReport} />
    </div>
  );
}
