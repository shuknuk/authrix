import { redirect } from "next/navigation";
import { isAuthConfigured } from "@/lib/auth/auth0";
import { getOptionalSession } from "@/lib/auth/session";

const OPERATING_LOOP = [
  "Team activity enters Authrix through engineering signals, meetings, approvals, and the control surface.",
  "Specialized internal agents turn that activity into summaries, decisions, ownership signals, and drift alerts.",
  "The control tower shows what changed, what needs approval, and what the startup should do next.",
];

const AGENTS = [
  ["Engineer", "Technical change awareness and engineering summaries"],
  ["Docs", "Meeting intelligence, decision capture, and durable knowledge"],
  ["Workflow", "Ownership, follow-through, and accountability"],
  ["Finance/Ops", "Spend posture, founder finance answers, and operational risk"],
];

export default async function Home() {
  const session = await getOptionalSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="space-y-8 py-8">
      <div className="relative mx-auto w-full max-w-6xl overflow-hidden rounded-[2.4rem] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(6,10,19,0.9))] p-8 shadow-[0_30px_90px_rgba(2,6,23,0.45)] md:p-12">
        <div className="pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-[radial-gradient(circle_at_center,rgba(103,232,249,0.16),transparent_65%)]" />
        <div className="pointer-events-none absolute -left-10 top-12 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.18),transparent_70%)] blur-2xl" />

        <div className="relative grid gap-10 lg:grid-cols-[1.35fr_0.9fr] lg:items-end">
          <div>
            <div className="inline-flex items-center gap-3 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan-100/80">
                Authrix
              </span>
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-200" />
              <span className="text-[11px] uppercase tracking-[0.24em] text-slate-400">
                Startup operations layer
              </span>
            </div>

            <h1 className="mt-6 max-w-3xl text-4xl font-semibold tracking-tight text-zinc-50 md:text-6xl md:leading-[1.02]">
              Secure autonomous operations for startup teams
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-slate-300/90">
              Authrix turns engineering activity, decisions, ownership, and operational
              signals into a live control tower for a startup&apos;s always-on worker
              system.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {isAuthConfigured ? (
                <a
                  href="/auth/login?returnTo=/dashboard"
                  className="inline-flex rounded-full bg-gradient-to-r from-cyan-200 via-cyan-100 to-white px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-105"
                >
                  Sign in with Auth0
                </a>
              ) : (
                <div className="rounded-[1.35rem] border border-amber-300/20 bg-amber-300/10 px-5 py-4 text-sm text-amber-100/90">
                  Auth0 is not configured yet. Add your tenant values to `.env.local`
                  using `.env.example`, then restart the app.
                </div>
              )}
              <span className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
                Control tower, approvals, drift, and worker-box deployment
              </span>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.6rem] border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                Core pillars
              </p>
              <div className="mt-4 grid gap-3 text-sm text-slate-300">
                <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3">
                  Engineering summaries and follow-through
                </div>
                <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3">
                  Approval-gated external actions
                </div>
                <div className="rounded-2xl border border-white/8 bg-slate-950/50 px-4 py-3">
                  Worker-box deployment and security posture
                </div>
              </div>
            </div>

            <div className="rounded-[1.6rem] border border-white/10 bg-gradient-to-br from-white/8 to-white/3 p-5">
              <p className="text-[11px] uppercase tracking-[0.24em] text-slate-500">
                Current state
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-emerald-100/80">
                  Runtime aware
                </span>
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-cyan-100/80">
                  Auth0 secured
                </span>
                <span className="rounded-full border border-amber-300/20 bg-amber-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-amber-100/80">
                  Product polish
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(7,11,20,0.92))] p-6 shadow-[0_24px_70px_rgba(2,6,23,0.32)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/75">
            How Authrix Operates
          </p>
          <div className="mt-5 grid gap-3">
            {OPERATING_LOOP.map((step, index) => (
              <div
                key={step}
                className="flex items-start gap-3 rounded-[1.35rem] border border-white/8 bg-slate-950/50 px-4 py-4"
              >
                <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-cyan-300/20 bg-cyan-300/10 text-[11px] font-semibold text-cyan-100">
                  {index + 1}
                </span>
                <p className="text-sm leading-6 text-slate-300/90">{step}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(7,11,20,0.92))] p-6 shadow-[0_24px_70px_rgba(2,6,23,0.32)]">
          <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-cyan-200/75">
            Internal Specialists
          </p>
          <div className="mt-5 grid gap-3">
            {AGENTS.map(([name, role]) => (
              <div
                key={name}
                className="flex items-start justify-between gap-4 rounded-[1.35rem] border border-white/8 bg-slate-950/50 px-4 py-4"
              >
                <div>
                  <p className="text-sm font-semibold text-zinc-100">{name}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-400">{role}</p>
                </div>
                <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[10px] uppercase tracking-[0.18em] text-zinc-300">
                  Shared workspace
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
