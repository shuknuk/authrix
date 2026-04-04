import { CardShell } from "@/components/ui/card-shell";
import type { ModelLayerStatus } from "@/types/models";

interface ModelLayerCardProps {
  status: ModelLayerStatus;
}

export function ModelLayerCard({ status }: ModelLayerCardProps) {
  return (
    <CardShell
      title="Model Layer"
      description="Per-specialist default models, routing posture, and the current provider boundary for Authrix's model-backed execution path."
    >
      <div className="space-y-4">
        <div className="authrix-row px-4 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background-muted)] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
              {status.provider}
            </span>
            <span
              className="rounded-[var(--radius-sm)] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em]"
              style={{
                color: status.configured ? "var(--success)" : "var(--warning)",
                background: status.configured
                  ? "color-mix(in srgb, var(--success) 8%, transparent)"
                  : "color-mix(in srgb, var(--warning) 8%, transparent)",
              }}
            >
              {status.configured ? "Configured" : "Fallback"}
            </span>
            <span className="rounded-[var(--radius-sm)] border border-[var(--primary-border)] bg-[color:color-mix(in_srgb,var(--primary)_8%,transparent)] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--primary)]">
              Router: {status.routerMode}
            </span>
          </div>
          <p className="mt-3 text-sm leading-6 text-[var(--foreground)]/92">{status.description}</p>
          {status.baseUrl ? (
            <p className="mt-3 text-xs text-[var(--muted-foreground)]">Provider base URL: {status.baseUrl}</p>
          ) : null}
          {status.routerModel ? (
            <p className="mt-2 text-xs text-[var(--muted-foreground)]">Router model: {status.routerModel}</p>
          ) : null}
        </div>

        <div className="grid gap-3 md:grid-cols-2">
          {status.agentConfigs.map((config) => (
            <div key={config.agentId} className="authrix-row px-4 py-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-[var(--foreground)]">{config.roleLabel}</p>
                <span className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--background-muted)] px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-[var(--muted-foreground)]">
                  {config.executionProfile}
                </span>
              </div>
              <p className="mt-3 text-xs uppercase tracking-[0.16em] text-[var(--muted-foreground)]">
                Default model
              </p>
              <p className="mt-2 text-sm text-[var(--foreground)]">{config.defaultModel}</p>
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  );
}
