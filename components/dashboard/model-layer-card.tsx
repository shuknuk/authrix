import { CardShell } from "@/components/ui/card-shell";
import type { ModelLayerStatus } from "@/types/models";

interface ModelLayerCardProps {
  status: ModelLayerStatus;
}

export function ModelLayerCard({ status }: ModelLayerCardProps) {
  return (
    <CardShell
      title="Model Layer"
      description="Per-agent default models, routing posture, and the current hosted provider boundary for Authrix's LLM-backed execution path."
    >
      <div className="space-y-4">
        <div className="rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-300">
              {status.provider}
            </span>
            <span
              className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${
                status.configured
                  ? "bg-emerald-300/10 text-emerald-100"
                  : "bg-amber-300/10 text-amber-100"
              }`}
            >
              {status.configured ? "Configured" : "Fallback"}
            </span>
            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-100/80">
              Router: {status.routerMode}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-300/90">{status.description}</p>
          {status.baseUrl ? (
            <p className="mt-3 text-xs text-zinc-500">Provider base URL: {status.baseUrl}</p>
          ) : null}
          {status.routerModel ? (
            <p className="mt-2 text-xs text-zinc-500">Router model: {status.routerModel}</p>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {status.agentConfigs.map((config) => (
            <div
              key={config.agentId}
              className="rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-4"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-zinc-100">{config.roleLabel}</p>
                <span className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-300">
                  {config.executionProfile}
                </span>
              </div>
              <p className="mt-3 text-xs uppercase tracking-[0.16em] text-zinc-500">
                Default model
              </p>
              <p className="mt-2 text-sm text-zinc-100">{config.defaultModel}</p>
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  );
}
