import { CardShell } from "@/components/ui/card-shell";
import { formatAgentLabel } from "@/lib/slack/operations";
import type { SlackDelegationRecord } from "@/types/messaging";

interface DelegationHistoryCardProps {
  delegations: SlackDelegationRecord[];
}

export function DelegationHistoryCard({
  delegations,
}: DelegationHistoryCardProps) {
  return (
    <CardShell
      title="Delegation History"
      description="When Slack requests span multiple domains, Authrix records which internal specialist picked up the follow-through."
    >
      <div className="space-y-3">
        {delegations.length > 0 ? (
          delegations.slice(0, 6).map((delegation) => (
            <div
              key={delegation.id}
              className="rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-cyan-300/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-100">
                  {formatAgentLabel(delegation.parentAgentId)}
                </span>
                <span className="text-[11px] text-zinc-500">to</span>
                <span className="rounded-full bg-emerald-300/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-100">
                  {formatAgentLabel(delegation.delegatedAgentId)}
                </span>
                <span className="text-[11px] text-zinc-500">
                  {new Date(delegation.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-100">{delegation.reason}</p>
            </div>
          ))
        ) : (
          <div className="rounded-[1.35rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-6">
            <p className="text-sm text-zinc-200">No delegations yet.</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              When a Slack request spans engineering, docs, workflow, or ops at the same
              time, the handoff chain will appear here.
            </p>
          </div>
        )}
      </div>
    </CardShell>
  );
}
