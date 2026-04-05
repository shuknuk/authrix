import { ApiSpendRiskCard } from "@/components/cards/api-spend-risk-card";
import { ApprovalQueueCard } from "@/components/cards/approval-queue-card";
import { PageHeader } from "@/components/layout/page-header";
import { devopsAgent } from "@/lib/agents/devopsAgent";
import { getMockUsageCostInput } from "@/lib/mock/costs";
import { listApprovalQueue } from "@/lib/orchestrator/approval-store";

export default function CostsPage() {
  const insight = devopsAgent(getMockUsageCostInput());
  const approvalQueue = listApprovalQueue();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Costs"
        title="Spend and delivery risk"
        description="The DevOps card is mock-first for the MVP, but the output stays typed and presentation-ready so a real provider can replace it later without changing the UI shape."
      />

      <section className="grid gap-5 xl:grid-cols-[1fr_0.92fr]">
        <ApiSpendRiskCard insight={insight} />
        <ApprovalQueueCard items={approvalQueue} />
      </section>
    </div>
  );
}
