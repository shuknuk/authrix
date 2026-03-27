import { CardFrame } from "@/components/cards/card-frame";
import { StatusBadge } from "@/components/ui/status-badge";
import type { CostRiskInsight } from "@/types/authrix";

export function ApiSpendRiskCard({
  insight,
  status = "ready",
}: {
  insight?: CostRiskInsight;
  status?: "ready" | "loading" | "empty" | "error";
}) {
  return (
    <CardFrame
      eyebrow="Devops agent"
      title="API Spend / Risk"
      description="Mock-first cost and delivery risk view for the current operating window."
      status={status}
      emptyMessage="Cost and risk insight will appear when usage data is available."
      errorMessage="The DevOps agent could not compute the spend view."
    >
      {insight ? (
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-4xl font-semibold text-foreground">
                {insight.spendUsd}
              </p>
              <p className="mt-2 text-sm text-muted">{insight.window}</p>
            </div>
            <StatusBadge
              tone={
                insight.budgetStatus === "on_track"
                  ? "success"
                  : insight.budgetStatus === "watch"
                    ? "warning"
                    : "danger"
              }
            >
              {insight.budgetStatus.replace("_", " ")}
            </StatusBadge>
          </div>
          <p className="text-sm leading-7 text-muted">{insight.summary}</p>
          <div className="rounded-[1.25rem] bg-[rgba(17,33,50,0.04)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">
              Risks
            </p>
            <ul className="mt-3 space-y-2 text-sm leading-7 text-foreground">
              {insight.risks.map((risk) => (
                <li key={risk}>{risk}</li>
              ))}
            </ul>
          </div>
        </div>
      ) : null}
    </CardFrame>
  );
}
