import { CardShell } from "@/components/ui/card-shell";
import { formatAgentLabel } from "@/lib/slack/operations";
import type { SlackConversation, SlackDispatchRecord } from "@/types/messaging";

interface ChatActivityCardProps {
  conversations: SlackConversation[];
  dispatches?: SlackDispatchRecord[];
}

export function ChatActivityCard({
  conversations,
  dispatches = [],
}: ChatActivityCardProps) {
  return (
    <CardShell
      title="Messaging Surface"
      description="Slack-bound conversations and agent routing visibility for Authrix's chat-first operating model."
    >
      <div className="space-y-3">
        {conversations.length > 0 ? (
          conversations.slice(0, 5).map((conversation) => {
            const latestDispatch = dispatches.find(
              (dispatch) => dispatch.conversationId === conversation.id
            );

            return (
              <div
                key={conversation.id}
                className="rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-zinc-100">{conversation.title}</p>
                    <p className="mt-1 text-xs leading-5 text-slate-400">
                      Routed to {formatAgentLabel(conversation.routedAgentId)} in channel{" "}
                      {conversation.channelId} and updated{" "}
                      {new Date(conversation.updatedAt).toLocaleString()}.
                    </p>
                    {latestDispatch ? (
                      <p className="mt-2 text-[11px] text-zinc-500">
                        Router: {latestDispatch.routeMode}
                        {latestDispatch.routeModel ? ` via ${latestDispatch.routeModel}` : ""}
                        {latestDispatch.delegationIds.length > 0
                          ? ` · ${latestDispatch.delegationIds.length} delegation(s)`
                          : ""}
                        {latestDispatch.taskDispatchIds.length > 0
                          ? ` · ${latestDispatch.taskDispatchIds.length} follow-up task(s)`
                          : ""}
                      </p>
                    ) : null}
                  </div>
                  <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-100/80">
                    Slack
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-[1.35rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-6">
            <p className="text-sm text-zinc-200">No Slack conversations yet.</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Phase 10 adds Slack as Authrix&apos;s first professional messaging surface.
              Once events are connected, routed conversations will appear here.
            </p>
          </div>
        )}
      </div>
    </CardShell>
  );
}
