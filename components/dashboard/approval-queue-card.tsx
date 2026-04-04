import { CardShell } from "@/components/ui/card-shell";
import { EmptyState } from "@/components/ui/empty-state";
import { StatusPill } from "@/components/ui/status-pill";
import { getActionPolicy } from "@/lib/security/action-policy";
import type { ApprovalRequest } from "@/types/domain";

interface ApprovalQueueCardProps {
  approvals: ApprovalRequest[];
  limit?: number;
}

function riskTone(level: ApprovalRequest["riskLevel"]) {
  if (level === "high") {
    return "danger" as const;
  }

  if (level === "medium") {
    return "warning" as const;
  }

  return "neutral" as const;
}

function statusTone(status: ApprovalRequest["status"]) {
  if (status === "approved") {
    return "success" as const;
  }

  if (status === "rejected") {
    return "danger" as const;
  }

  return "warning" as const;
}

export function ApprovalQueueCard({
  approvals,
  limit,
}: ApprovalQueueCardProps) {
  const visibleApprovals = typeof limit === "number" ? approvals.slice(0, limit) : approvals;
  const pendingCount = approvals.filter((approval) => approval.status === "pending").length;

  return (
    <CardShell
      title="Approval Queue"
      description="Display-first governance queue. Proposed writes remain here until a human decision is recorded."
      tone="warning"
      actions={pendingCount > 0 ? <StatusPill tone="warning">{pendingCount} pending</StatusPill> : null}
    >
      {visibleApprovals.length === 0 ? (
        <EmptyState
          title="No approvals waiting"
          description="New write proposals will appear here with risk and policy context."
        />
      ) : (
        <div className="overflow-x-auto rounded-[12px] border border-[var(--border)] bg-[var(--background)]">
          <table className="min-w-full text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-[11px] uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                <th className="px-4 py-3 font-medium">Action</th>
                <th className="px-4 py-3 font-medium">Tier</th>
                <th className="px-4 py-3 font-medium">Risk</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {visibleApprovals.map((approval) => {
                const policy = getActionPolicy(approval.actionKind);

                return (
                  <tr key={approval.id} className="border-t border-[var(--border)] align-top first:border-t-0">
                    <td className="px-4 py-3">
                      <p className="font-medium text-[var(--foreground-strong)]">{approval.title}</p>
                      <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">
                        {approval.description}
                      </p>
                      <p className="mt-1 text-[11px] text-[var(--muted-foreground)]">
                        {approval.sourceAgent} · {approval.affectedSystem}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--muted-foreground)]">
                      {policy.executionTier}
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill tone={riskTone(approval.riskLevel)} size="sm">
                        {approval.riskLevel}
                      </StatusPill>
                    </td>
                    <td className="px-4 py-3">
                      <StatusPill tone={statusTone(approval.status)} size="sm">
                        {approval.status}
                      </StatusPill>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </CardShell>
  );
}
