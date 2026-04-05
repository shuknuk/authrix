import { FinanceQACard } from "@/components/dashboard/finance-qa-card";
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
        title="Finance"
        description="Founder-facing spend visibility, billing-source posture, and source-backed finance answers tied to the current Authrix workspace."
      />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <CostSourceCard report={snapshot.costReport} pipeline={costPipeline} />
        <FinanceQACard />
      </div>
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <CostRiskCard report={snapshot.costReport} />
        <RiskAlertsCard
          alerts={operationsAlerts}
          title="Finance/Ops Alerts"
          description="Anomaly and spend-risk signals currently affecting the workspace."
        />
      </div>
      <RiskAlertsCard
        alerts={driftAlerts}
        title="Finance And Execution Drift"
        description="Cross-signal drift where spend, approvals, docs, or ownership are no longer lining up cleanly."
        limit={3}
      />
    </div>
  );
}
