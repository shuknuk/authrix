import {
  ShieldCheck, FileText, CheckSquare, ClipboardList,
  Radio, Settings, AlertTriangle, CheckCircle2, GitCommit, Circle,
} from 'lucide-react';

/* Always dark — product preview */
const BG      = '#0A0A0A';
const SURFACE = '#0F0F0F';
const RAISED  = '#080808';
const BORDER  = '#1F1F1F';
const BORDER2 = '#2A2A2A';
const TEXT     = '#F5F5F5';
const TEXT2    = '#D4D4D4';
const MUTED    = '#737373';
const ORANGE   = '#F97316';
const ORG_DIM  = 'rgba(249,115,22,0.10)';
const ORG_BD   = 'rgba(249,115,22,0.22)';
const WARN     = '#D97706';
const WARN_DIM = 'rgba(217,119,6,0.10)';
const CRIT     = '#EF4444';
const CRIT_DIM = 'rgba(239,68,68,0.10)';
const OK       = '#22C55E';

const NAV = [
  { icon: FileText,      label: 'Weekly Summary', active: true,  badge: null, bt: null },
  { icon: CheckSquare,   label: 'Suggested Tasks', active: false, badge: '4',  bt: 'warn' },
  { icon: ClipboardList, label: 'Approval Queue',  active: false, badge: '2',  bt: 'crit' },
  { icon: Radio,         label: 'Signal Sources',  active: false, badge: null, bt: null },
  { icon: Settings,      label: 'Settings',        active: false, badge: null, bt: null },
];

function Stat({ label, value, sub, color, dim }: { label: string; value: string; sub: string; color: string; dim: string }) {
  return (
    <div style={{ borderLeft: `2px solid ${color}`, paddingLeft: '10px' }}>
      <div style={{ fontSize: '8px', fontFamily: 'JetBrains Mono, monospace', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>{label}</div>
      <div style={{ fontSize: '14px', fontWeight: 600, color, lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '8px', color: MUTED, marginTop: '3px' }}>{sub}</div>
    </div>
  );
}

function SignalRow({ icon: Icon, level, text }: { icon: typeof AlertTriangle; level: 'warn' | 'ok' | 'info'; text: string }) {
  const c = level === 'warn' ? WARN : level === 'ok' ? OK : MUTED;
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', padding: '6px 0', borderBottom: `1px solid ${BORDER}` }}
      className="last:border-0">
      <Icon style={{ width: 10, height: 10, marginTop: 2, flexShrink: 0, color: c }} strokeWidth={2} />
      <span style={{ fontSize: '10px', color: TEXT2, lineHeight: 1.5 }}>{text}</span>
    </div>
  );
}

function TaskRow({ priority, text }: { priority: 'high' | 'med' }) {
  const p = priority === 'high' ? { label: 'HIGH', color: CRIT, bg: CRIT_DIM } : { label: 'MED', color: WARN, bg: WARN_DIM };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 8px', background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '4px' }}>
      <span style={{ fontSize: '7px', fontFamily: 'JetBrains Mono, monospace', color: p.color, background: p.bg, padding: '1px 5px', borderRadius: '2px', flexShrink: 0 }}>{p.label}</span>
      <span style={{ fontSize: '10px', color: TEXT, flex: 1 }}>{text}</span>
      <Circle style={{ width: 6, height: 6, flexShrink: 0, color: BORDER2 }} />
    </div>
  );
}

export function ProductMockup() {
  return (
    <div style={{ fontFamily: 'Inter, sans-serif', position: 'relative', width: '100%' }}>
      {/* Ambient glow */}
      <div style={{
        position: 'absolute', inset: '-60px', zIndex: -1, pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 60% 35%, rgba(249,115,22,0.07) 0%, transparent 60%)',
        filter: 'blur(20px)',
      }} />

      {/* Window frame */}
      <div style={{
        borderRadius: '8px', overflow: 'hidden', background: SURFACE,
        border: `1px solid ${BORDER}`,
        boxShadow: '0 32px 80px rgba(0,0,0,0.85), 0 0 0 1px rgba(31,31,31,0.6)',
      }}>
        {/* Title bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 16px', background: BG, borderBottom: `1px solid ${BORDER}` }}>
          <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
            {['rgba(239,68,68,0.4)', 'rgba(245,158,11,0.4)', 'rgba(34,197,94,0.4)'].map((c, i) => (
              <div key={i} style={{ width: 10, height: 10, borderRadius: '50%', background: c }} />
            ))}
          </div>
          {/* Tab-style title — no fake domain */}
          <div style={{ display: 'flex', gap: '4px' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              padding: '4px 12px', borderRadius: '4px 4px 0 0',
              background: SURFACE, borderBottom: `1px solid ${SURFACE}`,
              borderLeft: `1px solid ${BORDER}`, borderRight: `1px solid ${BORDER}`, borderTop: `1px solid ${BORDER}`,
            }}>
              <ShieldCheck style={{ width: 10, height: 10, color: ORANGE }} />
              <span style={{ fontSize: '9px', color: TEXT, fontWeight: 500 }}>Weekly Summary</span>
            </div>
            <div style={{ padding: '4px 12px', fontSize: '9px', color: MUTED, alignSelf: 'center' }}>Approvals</div>
          </div>
        </div>

        {/* App layout */}
        <div style={{ display: 'flex', height: '385px' }}>

          {/* Sidebar */}
          <div style={{ width: '148px', flexShrink: 0, background: SURFACE, borderRight: `1px solid ${BORDER}`, display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 12px', borderBottom: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg width="13" height="13" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ flexShrink: 0 }}>
                <path d="M8 15 L14 3 L20 15" stroke={ORANGE} strokeWidth="2.6" strokeLinejoin="miter" strokeLinecap="butt" />
                <rect x="2" y="15" width="24" height="11" rx="2.5" fill={ORANGE} />
                <rect x="6.2" y="14.5" width="3.6" height="3" rx="0.5" fill="#d96010" />
                <rect x="18.2" y="14.5" width="3.6" height="3" rx="0.5" fill="#d96010" />
                <circle cx="14" cy="19.5" r="2.2" fill="#0a0a0a" />
                <rect x="12.8" y="21.2" width="2.4" height="3.2" rx="0.6" fill="#0a0a0a" />
              </svg>
              <span style={{ fontSize: '11px', fontWeight: 600, color: TEXT }}>Authrix</span>
              <span style={{ marginLeft: 'auto', fontSize: '7px', fontFamily: 'JetBrains Mono, monospace', color: ORANGE, background: ORG_DIM, padding: '1px 4px', borderRadius: '2px' }}>beta</span>
            </div>

            <div style={{ flex: 1, padding: '8px 6px', display: 'flex', flexDirection: 'column', gap: '2px', overflow: 'hidden' }}>
              {NAV.map(item => (
                <div key={item.label} style={{
                  display: 'flex', alignItems: 'center', gap: '7px',
                  padding: '6px 8px', borderRadius: '4px', cursor: 'pointer',
                  background: item.active ? RAISED : 'transparent',
                  color: item.active ? TEXT : MUTED,
                  borderLeft: item.active ? `2px solid ${ORANGE}` : '2px solid transparent',
                  fontSize: '9.5px',
                  transition: 'all 0.15s',
                }}>
                  <item.icon style={{ width: 11, height: 11, flexShrink: 0 }} strokeWidth={1.5} />
                  <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                  {item.badge && (
                    <span style={{
                      fontSize: '8px', padding: '1px 4px', borderRadius: '2px', flexShrink: 0,
                      fontFamily: 'JetBrains Mono, monospace', fontWeight: 500,
                      color: item.bt === 'crit' ? CRIT : WARN,
                      background: item.bt === 'crit' ? CRIT_DIM : WARN_DIM,
                    }}>{item.badge}</span>
                  )}
                </div>
              ))}
            </div>

            <div style={{ padding: '10px 12px', borderTop: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: ORG_DIM, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '7px', color: ORANGE, fontFamily: 'JetBrains Mono, monospace', fontWeight: 600 }}>AK</span>
              </div>
              <div style={{ overflow: 'hidden' }}>
                <div style={{ fontSize: '9px', color: TEXT, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>A. Kim</div>
                <div style={{ fontSize: '8px', color: MUTED, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Eng Lead</div>
              </div>
            </div>
          </div>

          {/* Main content */}
          <div style={{ flex: 1, overflow: 'auto', padding: '16px', background: RAISED }}>

            {/* Page header */}
            <div style={{ marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: TEXT }}>Weekly Engineering Summary</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '9px', fontFamily: 'JetBrains Mono, monospace', color: MUTED }}>Mar 24–28, 2025</span>
                <span style={{ fontSize: '8px', color: ORANGE, background: ORG_DIM, border: `1px solid ${ORG_BD}`, padding: '1px 6px', borderRadius: '2px', fontFamily: 'JetBrains Mono, monospace' }}>AI generated</span>
                <span style={{ fontSize: '8px', color: OK, background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)', padding: '1px 6px', borderRadius: '2px', fontFamily: 'JetBrains Mono, monospace' }}>Reviewed</span>
              </div>
            </div>

            {/* Stats row — left-border style */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', padding: '12px 0', borderTop: `1px solid ${BORDER}`, borderBottom: `1px solid ${BORDER}`, marginBottom: '12px' }}>
              <Stat label="Usage signals" value="+14%"  sub="vs 4-week baseline" color={WARN} dim={WARN_DIM} />
              <Stat label="Tasks suggested" value="4"     sub="2 new this week"    color={ORANGE} dim={ORG_DIM} />
              <Stat label="Pending approval" value="2"   sub="action required"    color={CRIT} dim={CRIT_DIM} />
            </div>

            {/* Summary */}
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '4px', padding: '10px', marginBottom: '10px' }}>
              <div style={{ fontSize: '8px', fontFamily: 'JetBrains Mono, monospace', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px' }}>Summary</div>
              <p style={{ fontSize: '10px', lineHeight: 1.6, color: TEXT2 }}>
                Five PRs merged across auth and payment services. Standup notes flagged a coordination gap. API usage up 14% above baseline. Two external actions pending approval.
              </p>
            </div>

            {/* Signals */}
            <div style={{ background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: '4px', padding: '10px', marginBottom: '10px' }}>
              <div style={{ fontSize: '8px', fontFamily: 'JetBrains Mono, monospace', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '4px' }}>Notable Signals</div>
              <SignalRow icon={AlertTriangle} level="warn" text="API usage 14% above 4-week rolling baseline" />
              <SignalRow icon={AlertTriangle} level="warn" text="2 approval requests pending — action required" />
              <SignalRow icon={GitCommit}     level="ok"   text="payment-service v1.8.2 merged · 0 test failures" />
            </div>

            {/* Tasks */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <div style={{ fontSize: '8px', fontFamily: 'JetBrains Mono, monospace', color: MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Suggested Tasks</div>
                <span style={{ fontSize: '9px', color: ORANGE, cursor: 'pointer' }}>view all →</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <TaskRow priority="high" text="Review API budget threshold and notify team" />
                <TaskRow priority="med"  text="Follow up on deployment coordination gap" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}