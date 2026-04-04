import { ArrowRight, KeyRound, ShieldCheck, Eye, Box } from 'lucide-react';

const TRUST = [
  { icon: KeyRound,    label: 'Delegated identity',       sub: 'Auth0 OAuth flows — no stored credentials' },
  { icon: ShieldCheck, label: 'Approval-aware execution', sub: 'Sensitive actions require explicit approval' },
  { icon: Eye,         label: 'Audit-visible workflows',  sub: 'Provenance and outcome always visible' },
  { icon: Box,         label: 'Worker-box posture',       sub: 'Dedicated, scoped deployment environment' },
];

export function CTASection() {
  return (
    <section
      id="demo"
      className="py-28 px-6"
      style={{
        fontFamily: 'Inter, sans-serif',
        background: 'var(--card)',
        borderTop: '1px solid var(--border)',
      }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">

          {/* Left: headline + CTAs */}
          <div className="lg:col-span-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-5">
              Early access
            </div>
            <h2
              className="font-semibold text-foreground mb-6"
              style={{ fontSize: 'clamp(1.6rem, 2.6vw, 2.4rem)', lineHeight: 1.2, letterSpacing: '-0.02em' }}
            >
              Operational clarity,
              with humans still in control
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-10" style={{ fontSize: '15px' }}>
              Authrix turns engineering activity, meeting records, workflow signals, and operational
              data into structured, auditable action for startup teams.
              If your team values reviewability and approval-first execution, we should talk.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <a
                href="#"
                className="inline-flex items-center justify-center gap-2 px-6 py-2.5 text-sm font-medium rounded transition-all duration-150"
                style={{ background: 'var(--primary)', color: 'var(--primary-foreground)' }}
                onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
                onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
              >
                Request Early Access
                <ArrowRight className="size-3.5" />
              </a>
              <a
                href="#"
                className="inline-flex items-center justify-center px-6 py-2.5 text-sm font-medium rounded border transition-all duration-150 text-muted-foreground hover:text-foreground hover:border-primary/40"
                style={{ border: '1px solid var(--border)' }}
              >
                Schedule a conversation
              </a>
            </div>
          </div>

          {/* Right: trust items in a clean grid */}
          <div className="lg:col-span-6 lg:col-start-7">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-px" style={{ background: 'var(--border)' }}>
              {TRUST.map(item => (
                <div
                  key={item.label}
                  className="group flex flex-col gap-4 p-6 transition-colors duration-200 cursor-default"
                  style={{ background: 'var(--card)' }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLDivElement).style.background = 'color-mix(in srgb, var(--primary) 3%, var(--card))';
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLDivElement).style.background = 'var(--card)';
                  }}
                >
                  <div
                    className="size-8 flex items-center justify-center rounded shrink-0"
                    style={{ background: 'var(--background)', border: '1px solid var(--border)' }}
                  >
                    <item.icon
                      className="size-3.5 text-muted-foreground group-hover:text-primary transition-colors duration-200"
                      strokeWidth={1.5}
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-foreground mb-1">{item.label}</div>
                    <div className="text-xs text-muted-foreground leading-relaxed">{item.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
