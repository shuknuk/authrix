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
            <div key={dispatch.id} className="authrix-row px-4 py-4">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="rounded-[var(--radius-sm)] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em]"
                  style={{
                    color:
                      dispatch.priority === "high"
                          ? "var(--warning)"
                          : dispatch.priority === "medium"
                            ? "var(--primary)"
                            : "var(--muted-foreground)",
                    background:
                      dispatch.priority === "high"
                          ? "color-mix(in srgb, var(--warning) 8%, transparent)"
                          : dispatch.priority === "medium"
                            ? "color-mix(in srgb, var(--primary) 8%, transparent)"
                            : "var(--background-muted)",
                  }}
                >
                  {dispatch.priority}
                </span>
                <span className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background-muted)] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  {formatAgentLabel(dispatch.assignedAgentId)}
                </span>
                <span className="text-[11px] text-[var(--muted-foreground)]">
                  {new Date(dispatch.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="mt-3 text-sm font-medium text-[var(--foreground)]">{dispatch.title}</p>
              <p className="mt-1 text-xs leading-5 text-[var(--muted-foreground)]">{dispatch.description}</p>
              {dispatch.suggestedOwner ? (
                <p className="mt-2 text-[11px] text-[var(--muted-foreground)]">
                  Suggested owner: {dispatch.suggestedOwner}
                </p>
              ) : null}
            </div>
          ))
        ) : (
          <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--background-muted)] px-4 py-6">
            <p className="text-sm text-[var(--foreground)]">No chat-born follow-up yet.</p>
            <p className="mt-2 text-xs leading-5 text-[var(--muted-foreground)]">
              When Slack requests contain owners, follow-ups, or action language, Authrix
              will capture them here and feed them into the workspace.
            </p>
          </div>
        )}
      </div>
    </CardShell>
  );
}
