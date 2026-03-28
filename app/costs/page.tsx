import { CostRiskCard } from "@/components/dashboard/cost-risk-card";
import { PageHeader } from "@/components/ui/page-header";
import { getCostReport } from "@/lib/data/workspace";

export default async function CostsPage() {
  const report = await getCostReport();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Costs"
        description="Spend visibility, anomaly detection, and risk framing for the systems Authrix monitors."
      />
      <CostRiskCard report={report} />
    </div>
  );
}
