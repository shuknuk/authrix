import { CardShell } from "@/components/ui/card-shell";
import { getSlackSetupStatus } from "@/lib/slack/config";

export function SlackSetupCard() {
  const setup = getSlackSetupStatus();
  const steps = [
    {
      label: "Signing secret",
      ready: setup.hasSigningSecret,
      description: "Required for Slack event signature verification.",
    },
    {
      label: "Bot token",
      ready: setup.hasBotToken,
      description: "Required for Authrix to reply inside Slack threads.",
    },
    {
      label: "App token",
      ready: setup.hasAppToken,
      description: "Reserved for deeper Slack runtime patterns such as Socket Mode.",
    },
    {
      label: "Workspace and bot identity",
      ready: setup.hasWorkspaceId && setup.hasBotUserId,
      description: "Used to align the Slack surface with one Authrix workspace and avoid self-trigger loops.",
    },
  ];

  return (
    <CardShell
      title="Slack Onboarding"
      description="Slack is Authrix's first professional messaging surface. Configure the Slack app once, then operators can message Authrix directly from startup channels and DMs."
    >
      <div className="space-y-3">
        <div className="rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-zinc-500">
            Events endpoint
          </p>
          <p className="mt-2 text-sm text-zinc-100">`POST /api/slack/events`</p>
          <p className="mt-2 text-xs leading-5 text-slate-400">
            Use this as the Slack Events URL once your worker-box host is reachable. URL
            verification is already implemented.
          </p>
        </div>

        {steps.map((step) => (
          <div
            key={step.label}
            className="rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-zinc-100">{step.label}</p>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${
                  step.ready
                    ? "bg-emerald-300/10 text-emerald-100"
                    : "bg-amber-300/10 text-amber-100"
                }`}
              >
                {step.ready ? "Ready" : "Pending"}
              </span>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-400">{step.description}</p>
          </div>
        ))}
      </div>
    </CardShell>
  );
}
