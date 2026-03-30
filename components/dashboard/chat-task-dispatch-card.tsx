import { CardShell } from "@/components/ui/card-shell";
import { formatAgentLabel } from "@/lib/slack/operations";
import type { SlackTaskDispatchRecord } from "@/types/messaging";

interface ChatTaskDispatchCardProps {
  dispatches: SlackTaskDispatchRecord[];
}

export function ChatTaskDispatchCard({
  dispatches,
}: ChatTaskDispatchCardProps) {
  return (
    <CardShell
      title="Chat Follow-Through"
      description="Slack-native requests can be turned into persisted follow-up records before they drift into side conversations."
    >
      <div className="space-y-3">
        {dispatches.length > 0 ? (
          dispatches.slice(0, 6).map((dispatch) => (
            <div
              key={dispatch.id}
              className="rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-cyan-300/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-100">
                  {dispatch.priority}
                </span>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-300">
                  {formatAgentLabel(dispatch.assignedAgentId)}
                </span>
                <span className="text-[11px] text-zinc-500">
                  {new Date(dispatch.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-3 text-sm font-medium text-zinc-100">{dispatch.title}</p>
              <p className="mt-1 text-xs leading-5 text-slate-400">{dispatch.description}</p>
              {dispatch.suggestedOwner ? (
                <p className="mt-2 text-[11px] text-zinc-500">
                  Suggested owner: {dispatch.suggestedOwner}
                </p>
              ) : null}
            </div>
          ))
        ) : (
          <div className="rounded-[1.35rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-6">
            <p className="text-sm text-zinc-200">No chat-born follow-up yet.</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              When Slack requests contain owners, follow-ups, or action language, Authrix
              will capture them here and feed them into the control tower.
            </p>
          </div>
        )}
      </div>
    </CardShell>
  );
}
