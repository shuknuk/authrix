import { CardShell } from "@/components/ui/card-shell";
import type { SlackMessageRecord } from "@/types/messaging";

interface SlackMessageHistoryCardProps {
  messages: SlackMessageRecord[];
}

export function SlackMessageHistoryCard({
  messages,
}: SlackMessageHistoryCardProps) {
  return (
    <CardShell
      title="Slack Message History"
      description="Recent chat-driven requests and Authrix replies captured through the professional messaging layer."
    >
      <div className="space-y-3">
        {messages.length > 0 ? (
          messages.slice(0, 8).map((message) => (
            <div
              key={message.id}
              className="rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-4"
            >
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${
                    message.direction === "incoming"
                      ? "bg-[#4D7EA8]/10 text-[#DCE9F5]"
                      : "bg-[#6E9F78]/10 text-[#DCE9DF]"
                  }`}
                >
                  {message.direction}
                </span>
                {message.agentId ? (
                  <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-300">
                    {formatAgentLabel(message.agentId)}
                  </span>
                ) : null}
                <span className="text-[11px] text-zinc-500">
                  {new Date(message.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-2 text-xs uppercase tracking-[0.16em] text-zinc-500">
                {message.senderLabel}
              </p>
              <p className="mt-2 text-sm leading-6 text-zinc-100">{message.text}</p>
            </div>
          ))
        ) : (
          <div className="rounded-[1.35rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-6">
            <p className="text-sm text-zinc-200">No Slack message history yet.</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              As soon as operators start messaging Authrix through Slack, the requests and
              replies will appear here.
            </p>
          </div>
        )}
      </div>
    </CardShell>
  );
}

function formatAgentLabel(agentId: string): string {
  if (agentId === "docs") {
    return "Docs";
  }

  if (agentId === "workflow" || agentId === "task") {
    return "Workflow";
  }

  if (agentId === "devops") {
    return "DevOps";
  }

  return "Engineer";
}
