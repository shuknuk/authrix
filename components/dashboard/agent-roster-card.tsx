import { SPECIALIST_META, SpecialistCrab, type SpecialistRole } from "@/components/brand/specialist-crab";
import { CardShell } from "@/components/ui/card-shell";

const AGENTS: {
  name: string;
  role: string;
  description: string;
  specialist: SpecialistRole;
}[] = [
  {
    name: "Engineer",
    role: "technical change awareness",
    description:
      "Summarizes shipped work, highlights architecture shifts, and turns raw GitHub activity into operational context.",
    specialist: "engineer",
  },
  {
    name: "Docs",
    role: "knowledge capture",
    description:
      "Transforms meeting notes, transcripts, and sync summaries into durable records, decisions, and documentation updates.",
    specialist: "docs",
  },
  {
    name: "Workflow",
    role: "ownership and follow-through",
    description:
      "Extracts next steps, suggests owners, and keeps startup work from drifting after decisions are made.",
    specialist: "workflow",
  },
  {
    name: "DevOps",
    role: "cost and operational risk",
    description:
      "Tracks spend posture, detects drift, and explains operational anomalies against visible product activity.",
    specialist: "devops",
  },
];

export function AgentRosterCard() {
  return (
    <CardShell
      title="Specialist Roles"
      description="Authrix keeps four specialist viewpoints in one workspace so review stays structured and ownership stays visible."
    >
      <div className="grid gap-3 md:grid-cols-2">
        {AGENTS.map((agent) => (
          <div
            key={agent.name}
            className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <SpecialistCrab role={agent.specialist} />
                <p className="text-base font-semibold text-[var(--foreground)]">{agent.name}</p>
              </div>
              <span className={`rounded-[var(--radius-sm)] border px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${SPECIALIST_META[agent.specialist].panel} ${SPECIALIST_META[agent.specialist].tint}`}>
                {agent.role}
              </span>
            </div>
            <p className="mt-3 text-sm leading-6 text-[var(--muted-foreground)]">{agent.description}</p>
          </div>
        ))}
      </div>
    </CardShell>
  );
}
