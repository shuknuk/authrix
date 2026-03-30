import { CardShell } from "@/components/ui/card-shell";
import type { SlackBriefingRecord, SlackDispatchRecord } from "@/types/messaging";

interface ChatModelActivityCardProps {
  dispatches: SlackDispatchRecord[];
  briefings: SlackBriefingRecord[];
}

export function ChatModelActivityCard({
  dispatches,
  briefings,
}: ChatModelActivityCardProps) {
  const modelDispatches = dispatches.filter((item) => item.routeMode === "model");
  const deterministicDispatches = dispatches.filter(
    (item) => item.routeMode === "deterministic"
  );
  const groupedByModel = groupByModel(modelDispatches);

  return (
    <CardShell
      title="Model Activity"
      description="Authrix shows routed chat workload by model and mode so operators can understand which conversations are consuming hosted reasoning."
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <Metric label="Model-routed chats" value={String(modelDispatches.length)} />
        <Metric label="Deterministic chats" value={String(deterministicDispatches.length)} />
        <Metric label="Briefings generated" value={String(briefings.length)} />
      </div>
      <div className="mt-4 space-y-3">
        {groupedByModel.length > 0 ? (
          groupedByModel.map(([model, count]) => (
            <div
              key={model}
              className="flex items-center justify-between rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-3"
            >
              <p className="text-sm text-zinc-100">{model}</p>
              <span className="text-xs text-zinc-400">{count} routed request(s)</span>
            </div>
          ))
        ) : (
          <div className="rounded-[1.35rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-6">
            <p className="text-sm text-zinc-200">No model-routed chat history yet.</p>
            <p className="mt-2 text-xs leading-5 text-slate-400">
              Once Slack requests start hitting the hosted model layer, Authrix will show
              the routed workload here as a spend proxy.
            </p>
          </div>
        )}
      </div>
    </CardShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] border border-white/10 bg-white/5 px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.16em] text-zinc-500">{label}</p>
      <p className="mt-2 text-xl font-semibold text-zinc-50">{value}</p>
    </div>
  );
}

function groupByModel(dispatches: SlackDispatchRecord[]): Array<[string, number]> {
  const counts = new Map<string, number>();

  for (const dispatch of dispatches) {
    const key = dispatch.routeModel ?? "unknown";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()].sort((left, right) => right[1] - left[1]);
}
