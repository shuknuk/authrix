import { CardShell } from "@/components/ui/card-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { getActionPolicy } from "@/lib/security/action-policy";
import type { ApprovalRequest } from "@/types/domain";

interface ApprovalQueueCardProps {
  approvals: ApprovalRequest[];
  limit?: number;
}

export function ApprovalQueueCard({
  approvals,
  limit,
}: ApprovalQueueCardProps) {
  const visibleApprovals =
    typeof limit === "number" ? approvals.slice(0, limit) : approvals;
  const pendingCount = approvals.filter(
    (approval) => approval.status === "pending"
  ).length;

  return (
    <CardShell
      title="Approval Queue"
      description="Every write action is proposed first, then gated behind review."
      badge={
        pendingCount > 0 ? (
          <span className="inline-flex h-7 min-w-7 items-center justify-center rounded-full bg-orange-600 px-2 text-xs font-semibold text-white">
            {pendingCount}
          </span>
        ) : null
      }
    >
      {visibleApprovals.length === 0 ? (
        <EmptyState
          title="No approvals waiting"
          description="Low-risk analysis can run automatically. Proposed writes will appear here for review."
        />
      ) : (
        <div className="space-y-3">
          {visibleApprovals.map((approval) => (
            (() => {
              const policy = getActionPolicy(approval.actionKind);

              return (
                <div
                  key={approval.id}
                  className="flex items-start justify-between gap-3 rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-zinc-200">
                        {approval.title}
                      </p>
                      <span className="rounded-full border border-zinc-800 px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] text-zinc-500">
                        {policy.executionTier}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.18em] ${
                          approval.riskLevel === "high"
                            ? "bg-red-900/30 text-red-300"
                            : approval.riskLevel === "medium"
                              ? "bg-amber-900/30 text-amber-300"
                              : "bg-zinc-800 text-zinc-400"
                        }`}
                      >
                        {approval.riskLevel}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {approval.sourceAgent} | {approval.affectedSystem}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-3 py-1 text-xs ${
                      approval.status === "pending"
                        ? "bg-orange-900/30 text-orange-400"
                        : approval.status === "approved"
                          ? "bg-green-900/30 text-green-400"
                          : "bg-red-900/30 text-red-400"
                    }`}
                  >
                    {approval.status}
                  </span>
                </div>
              );
            })()
          ))}
        </div>
      )}
    </CardShell>
  );
}
