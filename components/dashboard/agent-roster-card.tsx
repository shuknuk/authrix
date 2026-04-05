import { CardShell } from "@/components/ui/card-shell";

const AGENTS = [
  {
    name: "Engineer",
    role: "technical change awareness",
    description:
      "Summarizes shipped work, highlights architecture shifts, and turns raw GitHub activity into operational context.",
    accent:
      "border-cyan-300/20 bg-cyan-300/10 text-cyan-100",
  },
  {
    name: "Docs",
    role: "knowledge capture",
    description:
      "Transforms meeting notes, transcripts, and sync summaries into durable records, decisions, and documentation updates.",
    accent:
      "border-emerald-300/20 bg-emerald-300/10 text-emerald-100",
  },
  {
    name: "Workflow",
    role: "ownership and follow-through",
    description:
      "Extracts next steps, suggests owners, and keeps startup work from drifting after decisions are made.",
    accent:
      "border-amber-300/20 bg-amber-300/10 text-amber-100",
  },
  {
    name: "Finance/Ops",
    role: "spend and operational risk",
    description:
      "Tracks spend posture, answers founder finance questions, and explains operational anomalies against visible workspace activity.",
    accent:
      "border-fuchsia-300/20 bg-fuchsia-300/10 text-fuchsia-100",
  },
];

export function AgentRosterCard() {
  return (
    <CardShell
      title="Operational Team"
      description="Authrix behaves like a startup operations system with specialized internal agents over one shared workspace."
    >
      <div className="grid gap-3 md:grid-cols-2">
        {AGENTS.map((agent) => (
          <div
            key={agent.name}
            className="rounded-[1.35rem] border border-white/10 bg-white/5 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-base font-semibold text-zinc-50">{agent.name}</p>
              <span
                className={`rounded-full border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${agent.accent}`}
              >
                {agent.role}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-300/90">{agent.description}</p>
          </div>
        ))}
      </div>
    </CardShell>
  );
}
