import { Cpu, UserCheck, FileSearch } from 'lucide-react';

const FLOW = [
  { label: 'Signal ingested',   sub: 'Read-only',      active: false },
  { label: 'Synthesizes',       sub: 'Governed',        active: true  },
  { label: 'Summary generated', sub: 'Structured',      active: true  },
  { label: 'Human reviews',     sub: 'Approval queue',  active: true  },
  { label: 'Action executes',   sub: 'If approved',     active: true  },
  { label: 'Outcome visible',   sub: 'Logged',          active: false },
];

const PRINCIPLES = [
  {
    icon: Cpu,
    role: 'Analysis',
    title: 'Observe, synthesize, recommend',
    desc: 'Authrix processes engineering signals and produces structured summaries and suggested tasks. It does not take unilateral action — no messages, no pipeline triggers, no state modifications on its own.',
    tag: 'Read-only analysis by default',
    tagColor: 'var(--primary)',
  },
  {
    icon: UserCheck,
    role: 'Human role',
    title: 'Approve before anything acts',
    desc: "External write actions enter an approval queue. A named person reviews and approves or denies. The system prepares the recommendation; the human decides what executes.",
    tag: 'Explicit human approval',
    tagColor: '#22C55E',
  },
  {
    icon: FileSearch,
    role: 'System role',
    title: 'Keep provenance visible',
    desc: 'Approval state, provenance, and execution outcome stay visible throughout. Your team can trace every recommendation, decision, and executed action.',
    tag: 'Audit-visible workflows',
    tagColor: 'var(--muted-foreground)',
  },
];

export function GovernanceSection() {
  return (
    <section
      id="governance"
      className="py-28 px-6 bg-background"
      style={{ fontFamily: 'Inter, sans-serif' }}
    >
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-20">
          <div className="lg:col-span-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-5">
              Governance
            </div>
            <h2
              className="font-semibold text-foreground"
              style={{ fontSize: 'clamp(1.6rem, 2.6vw, 2.4rem)', lineHeight: 1.2, letterSpacing: '-0.02em' }}
            >
              Governed operations,
              not autonomous execution
            </h2>
          </div>
          <div className="lg:col-span-6 lg:col-start-7 flex items-end">
            <p className="text-muted-foreground leading-relaxed" style={{ fontSize: '15px' }}>
              Designed for teams that need structured operational review without handing over
              decisions. Recommendations are generated and reviewed. Humans decide what acts.
            </p>
          </div>
        </div>

        {/* Execution flow pipeline */}
        <div
          className="mb-16 p-8 rounded"
          style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
        >
          <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-8">
            Execution flow
          </div>
          <div className="relative">
            {/* Connector line */}
            <div
              className="absolute hidden lg:block"
              style={{
                top: '8px',
                left: '8px',
                right: '8px',
                height: '1px',
                background: 'linear-gradient(to right, var(--border), var(--primary), var(--primary), var(--primary), var(--border))',
                opacity: 0.6,
              }}
            />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
              {FLOW.map((step, i) => (
                <div key={step.label} className="flex flex-col items-center gap-3 relative">
                  {/* Node */}
                  <div
                    className="size-4 rounded-full border-2 relative z-10 transition-transform duration-150 hover:scale-125"
                    style={{
                      background: step.active ? 'var(--primary)' : 'var(--card)',
                      borderColor: step.active ? 'var(--primary)' : 'var(--border)',
                      boxShadow: step.active ? '0 0 8px rgba(249,115,22,0.4)' : 'none',
                    }}
                  />
                  <div className="text-center">
                    <div
                      className="font-medium whitespace-nowrap"
                      style={{ fontSize: '11px', color: step.active ? 'var(--foreground)' : 'var(--muted-foreground)' }}
                    >
                      {step.label}
                    </div>
                    <div
                      className="font-mono whitespace-nowrap mt-0.5"
                      style={{ fontSize: '9px', color: step.active ? 'var(--primary)' : 'var(--muted-foreground)' }}
                    >
                      {step.sub}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div
            className="mt-8 pt-6 flex items-start gap-3"
            style={{ borderTop: '1px solid var(--border)' }}
          >
            <span
              className="text-[10px] font-mono px-2 py-1 rounded shrink-0"
              style={{ color: '#22C55E', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
            >
              Approval gate
            </span>
            <p className="text-sm text-muted-foreground leading-relaxed">
              External write actions are routed through approval-aware backend controls.
              Sensitive actions require explicit approval before execution.
              Blocked and fallback states remain visible — nothing fails silently.
            </p>
          </div>
        </div>

        {/* Principle cards — table-like with left accent */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-px" style={{ background: 'var(--border)' }}>
          {PRINCIPLES.map(p => (
            <div
              key={p.title}
              className="group flex flex-col gap-5 p-8 transition-colors duration-200 cursor-default"
              style={{ background: 'var(--background)', borderLeft: '2px solid transparent', transition: 'all 0.2s' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.background = 'color-mix(in srgb, var(--primary) 3%, var(--background))';
                (e.currentTarget as HTMLDivElement).style.borderLeftColor = 'var(--primary)';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.background = 'var(--background)';
                (e.currentTarget as HTMLDivElement).style.borderLeftColor = 'transparent';
              }}
            >
              <div className="flex items-center justify-between">
                <div
                  className="size-9 flex items-center justify-center rounded shrink-0"
                  style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
                >
                  <p.icon className="size-4 text-muted-foreground group-hover:text-primary transition-colors duration-200" strokeWidth={1.5} />
                </div>
                <span
                  className="text-[10px] font-mono px-2 py-1 rounded"
                  style={{ color: 'var(--muted-foreground)', background: 'var(--muted)', border: '1px solid var(--border)' }}
                >
                  {p.role}
                </span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground mb-2.5" style={{ lineHeight: 1.3 }}>
                  {p.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
              <div className="mt-auto pt-4" style={{ borderTop: '1px solid var(--border)' }}>
                <span
                  className="text-xs font-medium"
                  style={{ color: p.tagColor }}
                >
                  {p.tag}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Principle statement */}
        <div
          className="mt-px p-8 relative overflow-hidden"
          style={{ background: 'var(--background)', borderTop: '1px solid var(--border)', borderLeft: '2px solid var(--primary)' }}
        >
          <p
            className="text-foreground font-medium leading-relaxed mb-3"
            style={{ fontSize: 'clamp(1rem, 1.4vw, 1.15rem)', maxWidth: '64ch' }}
          >
            "The standard is simple: recommendations should be visible, approvals should be
            explicit, and outcomes should be traceable."
          </p>
          <div className="flex items-center gap-3">
            <span
              className="text-[10px] font-mono px-2 py-1 rounded"
              style={{ color: 'var(--primary)', background: 'color-mix(in srgb, var(--primary) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--primary) 25%, transparent)' }}
            >
              Authrix design principle
            </span>
            <span className="text-xs text-muted-foreground">Reviewability is the default posture.</span>
          </div>
        </div>
      </div>
    </section>
  );
}