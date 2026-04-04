import { CardShell } from "@/components/ui/card-shell";
import { SignalList } from "@/components/ui/signal-list";
import { StatusPill } from "@/components/ui/status-pill";
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
      description="Deployment mode, delegated identity, write policy, and runtime guardrails stay visible so the workspace remains inspectable."
      tone={posture.warnings.length > 0 ? "warning" : "success"}
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

        <SignalList
          items={visibleGuardrails.map((guardrail) => ({
            id: guardrail.id,
            title: guardrail.label,
            description: guardrail.message,
            meta: guardrail.state,
            tone:
              guardrail.state === "enabled"
                ? "success"
                : guardrail.state === "warning"
                  ? "warning"
                  : "danger",
          }))}
        />

        {posture.warnings.length > 0 ? (
          <div
            className="rounded-[var(--radius-sm)] border px-4 py-3"
            style={{
              borderColor: "color-mix(in srgb, var(--warning) 20%, transparent)",
              background: "color-mix(in srgb, var(--warning) 8%, transparent)",
            }}
          >
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-[var(--warning)]">
              Active warnings
            </p>
            <div className="mt-2 space-y-1">
              {posture.warnings.map((warning) => (
                <p key={warning} className="text-xs text-[var(--foreground)]/86">
                  {warning}
                </p>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-[var(--muted-foreground)]">
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
  return (
    <StatusPill
      tone={tone === "good" ? "success" : tone === "warn" ? "warning" : "danger"}
      size="sm"
    >
      {children}
    </StatusPill>
  );
}
