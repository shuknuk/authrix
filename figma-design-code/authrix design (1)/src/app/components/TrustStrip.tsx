import { KeyRound, ShieldCheck, Eye, Box } from 'lucide-react';

const ITEMS = [
  {
    icon: KeyRound,
    title: 'Delegated identity via Auth0',
    desc: 'OAuth flows only — no stored credentials or credential brokering.',
  },
  {
    icon: ShieldCheck,
    title: 'Approval-gated writes',
    desc: 'Sensitive actions require explicit human approval before execution.',
  },
  {
    icon: Eye,
    title: 'Audit-visible workflows',
    desc: 'Approval state, provenance, and outcome stay visible throughout.',
  },
  {
    icon: Box,
    title: 'Worker-box deployment',
    desc: 'Dedicated, scoped environment. Fallback and blocked states remain visible.',
  },
];

export function TrustStrip() {
  return (
    <section
      className="border-y border-border"
      style={{ background: 'var(--card)', fontFamily: 'Inter, sans-serif' }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-border">
          {ITEMS.map((item) => (
            <div
              key={item.title}
              className="group px-8 py-8 flex flex-col gap-4 transition-colors duration-200 cursor-default"
              style={{ borderLeft: '2px solid transparent', transition: 'border-color 0.2s, background 0.2s' }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLDivElement).style.borderLeftColor = 'var(--primary)';
                (e.currentTarget as HTMLDivElement).style.background = 'color-mix(in srgb, var(--primary) 3%, var(--card))';
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLDivElement).style.borderLeftColor = 'transparent';
                (e.currentTarget as HTMLDivElement).style.background = 'var(--card)';
              }}
            >
              <div
                className="size-8 flex items-center justify-center rounded shrink-0 transition-colors duration-200"
                style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
              >
                <item.icon className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors duration-200" strokeWidth={1.5} />
              </div>
              <div>
                <div className="text-sm font-medium text-foreground mb-1.5 group-hover:text-foreground transition-colors duration-200">
                  {item.title}
                </div>
                <div className="text-sm text-muted-foreground leading-relaxed">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
