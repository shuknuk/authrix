import { CardShell } from "@/components/ui/card-shell";
import type { SecurityPosture } from "@/types/security";

interface SecurityPostureCardProps {
  posture: SecurityPosture;
  compact?: boolean;
}

export function SecurityPostureCard({
  posture,
  compact = false,
}: SecurityPostureCardProps) {
  const visibleGuardrails = compact ? posture.guardrails.slice(0, 3) : posture.guardrails;

  return (
    <CardShell
      title="Security Posture"
      description="Deployment mode, delegated identity, write policy, and runtime guardrails are surfaced here so Authrix security stays inspectable."
    >
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Badge tone={posture.deploymentMode === "worker-box" ? "good" : "warn"}>
            {posture.deploymentMode === "worker-box" ? "Worker-box" : "Local dev"}
          </Badge>
          <Badge tone={posture.externalWritesEnabled ? "warn" : "good"}>
            {posture.externalWritesEnabled ? "External writes on" : "External writes blocked"}
          </Badge>
          <Badge tone={posture.tokenVaultConfigured ? "good" : "warn"}>
            {posture.tokenVaultConfigured ? "Token Vault ready" : "Token Vault partial"}
          </Badge>
          <Badge tone={posture.runtimeToolPolicy.hostLevelToolsAllowed ? "warn" : "good"}>
            {posture.runtimeToolPolicy.hostLevelToolsAllowed
              ? "Host tools allowed"
              : "Host tools blocked"}
          </Badge>
        </div>

        <div className="space-y-2">
          {visibleGuardrails.map((guardrail) => (
            <div
              key={guardrail.id}
              className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3"
            >
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-zinc-200">{guardrail.label}</p>
                <Badge tone={toneForGuardrail(guardrail.state)}>{guardrail.state}</Badge>
              </div>
              <p className="mt-1 text-xs text-zinc-500">{guardrail.message}</p>
            </div>
          ))}
        </div>

        {posture.warnings.length > 0 ? (
          <div className="rounded-xl border border-amber-900/50 bg-amber-950/20 px-4 py-3">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-amber-300">
              Active warnings
            </p>
            <div className="mt-2 space-y-1">
              {posture.warnings.map((warning) => (
                <p key={warning} className="text-xs text-amber-100/85">
                  {warning}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-500">
            No active posture warnings. Guardrail configuration matches the preferred deployment posture.
          </p>
        )}
      </div>
    </CardShell>
  );
}

function toneForGuardrail(state: SecurityPosture["guardrails"][number]["state"]) {
  if (state === "enabled") {
    return "good";
  }

  if (state === "warning") {
    return "warn";
  }

  return "danger";
}

function Badge({
  children,
  tone,
}: {
  children: React.ReactNode;
  tone: "good" | "warn" | "danger";
}) {
  const className =
    tone === "good"
      ? "bg-green-900/30 text-green-300"
      : tone === "warn"
        ? "bg-amber-900/30 text-amber-300"
        : "bg-red-900/30 text-red-300";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs ${className}`}>{children}</span>
  );
}
