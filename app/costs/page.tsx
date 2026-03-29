import { CostRiskCard } from "@/components/dashboard/cost-risk-card";
import { PageHeader } from "@/components/ui/page-header";
import { requireSession } from "@/lib/auth/session";
import { getWorkspaceSnapshot } from "@/lib/data/workspace";

export default async function CostsPage() {
  await requireSession("/costs");

  const snapshot = await getWorkspaceSnapshot();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Costs"
        description="Spend visibility, anomaly detection, and risk framing for the systems Authrix monitors."
      />
      <CostRiskCard report={snapshot.costReport} />
    </div>
  );
}
