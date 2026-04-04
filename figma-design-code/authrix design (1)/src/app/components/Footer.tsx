import { AuthrixLogo } from './AuthrixLogo';

const COLS: Record<string, string[]> = {
  Product:  ['Weekly Summary', 'Suggested Tasks', 'Approval Queue', 'Signal Sources'],
  Company:  ['About', 'Blog', 'Changelog'],
  Legal:    ['Privacy Policy', 'Terms of Service', 'Responsible Disclosure'],
  Connect:  ['GitHub', 'LinkedIn', 'Contact'],
};

export function Footer() {
  return (
    <footer
      className="border-t border-border"
      style={{ background: 'var(--background)', fontFamily: 'Inter, sans-serif' }}
    >
      {/* Main grid */}
      <div className="max-w-7xl mx-auto px-6 pt-16 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-6 gap-10 mb-12">

          {/* Brand — 2 cols */}
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-5">
              <AuthrixLogo size={24} />
              <span
                className="text-[10px] font-mono text-muted-foreground px-1.5 py-px rounded ml-0.5"
                style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
              >
                beta
              </span>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed" style={{ maxWidth: '28ch' }}>
              Authrix turns engineering activity, meeting records, workflow signals, and
              operational data into structured, auditable action for startup teams.
            </p>
          </div>

          {/* Link columns */}
          {Object.entries(COLS).map(([cat, items]) => (
            <div key={cat}>
              <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-4">
                {cat}
              </div>
              <ul className="space-y-2.5">
                {items.map(item => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div
          className="pt-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <div className="text-xs text-muted-foreground font-mono">
            © 2025 Authrix — Early access, active development
          </div>

          {/* Honest trust posture — no fake badges */}
          <div className="flex items-center gap-4 text-[10px] font-mono text-muted-foreground flex-wrap">
            <span>Auth0 delegated identity</span>
            <span style={{ color: 'var(--border)' }}>·</span>
            <span>Approval-gated writes</span>
            <span style={{ color: 'var(--border)' }}>·</span>
            <span>Worker-box posture</span>
            <span style={{ color: 'var(--border)' }}>·</span>
            <span>Read-only analysis by default</span>
          </div>
        </div>
      </div>
    </footer>
  );
}