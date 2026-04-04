import { useState } from 'react';
import {
  FileText, CheckSquare, ClipboardList,
  AlertTriangle, CheckCircle2, XCircle,
  TrendingUp, AlertCircle, ChevronRight, Clock, User, GitCommit,
} from 'lucide-react';

/* ── Panel 1: Weekly Summary ─────────────────────── */
function SummaryPanel() {
  return (
    <div className="divide-y divide-border">
      {/* Panel header */}
      <div className="px-8 py-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <div className="text-base font-semibold text-foreground mb-2">Weekly Engineering Summary</div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-muted-foreground">Week of Mar 24 – Mar 28, 2025</span>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded"
              style={{ color: 'var(--primary)', background: 'color-mix(in srgb, var(--primary) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--primary) 20%, transparent)' }}
            >
              System generated
            </span>
            <span
              className="text-[10px] font-mono px-2 py-0.5 rounded"
              style={{ color: '#22C55E', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
            >
              Reviewed
            </span>
          </div>
        </div>
        <button
          className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded border border-border transition-colors duration-150"
          style={{ background: 'var(--background)' }}
        >
          Export ↓
        </button>
      </div>

      {/* Metrics row — left-border stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-border">
        {[
          { label: 'PRs merged',         value: '5',     sub: 'across 3 repos',     color: '#22C55E' },
          { label: 'API usage change',   value: '+14%',  sub: 'vs 4-week baseline', color: '#D97706' },
          { label: 'Open action items',  value: '3',     sub: 'from meeting notes', color: '#D97706' },
          { label: 'Pending approval',   value: '2',     sub: 'action required',    color: '#EF4444' },
        ].map(m => (
          <div key={m.label} className="px-6 py-5">
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">{m.label}</div>
            <div className="font-semibold mb-1" style={{ fontSize: '22px', lineHeight: 1, color: m.color }}>{m.value}</div>
            <div className="text-xs text-muted-foreground">{m.sub}</div>
          </div>
        ))}
      </div>

      {/* Narrative */}
      <div className="px-8 py-6">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">Summary</div>
        <p className="text-sm text-foreground leading-relaxed mb-3">
          Five pull requests merged across the authentication and payment services this week.
          Standup notes flagged a recurring coordination gap between frontend and platform teams.
          API usage rose 14% above the four-week rolling baseline — within range, but worth
          reviewing before next sprint.
        </p>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Two follow-up tasks surfaced from meeting transcripts. No external write actions
          were executed this week. Two actions remain in the approval queue awaiting a decision.
        </p>
      </div>

      {/* Signal rows — table style */}
      <div className="px-8 pt-5 pb-6">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">Notable Signals</div>
        <div className="flex flex-col gap-1">
          {[
            { type: 'warn', icon: AlertTriangle, text: 'API usage 14% above 4-week baseline — review before next sprint' },
            { type: 'crit', icon: AlertCircle,   text: '2 external actions pending human approval in queue' },
            { type: 'ok',   icon: GitCommit,     text: 'payment-service v1.8.2 merged — 0 test failures across CI runs' },
            { type: 'ok',   icon: CheckCircle2,  text: 'Authentication refactor completed, reviewed in Thursday standup' },
          ].map((s, i) => {
            const c = s.type === 'crit' ? '#EF4444' : s.type === 'warn' ? '#D97706' : '#22C55E';
            const bg = s.type === 'crit' ? 'rgba(239,68,68,0.05)' : s.type === 'warn' ? 'rgba(217,119,6,0.05)' : 'rgba(34,197,94,0.05)';
            const bd = s.type === 'crit' ? 'rgba(239,68,68,0.15)' : s.type === 'warn' ? 'rgba(217,119,6,0.15)' : 'rgba(34,197,94,0.15)';
            return (
              <div key={i} className="flex items-start gap-3 px-4 py-3 rounded" style={{ background: bg, border: `1px solid ${bd}` }}>
                <s.icon className="size-3.5 mt-px shrink-0" style={{ color: c }} strokeWidth={1.5} />
                <span className="text-sm text-foreground">{s.text}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ── Panel 2: Suggested Tasks ─────────────────────── */
function TasksPanel() {
  const tasks = [
    { id: 'T-041', priority: 'high',   title: 'Review API usage trend before next sprint planning',    source: 'Signal: usage baseline — Mar 27', assignee: 'A. Kim',    risk: 'Spend signal' },
    { id: 'T-042', priority: 'high',   title: 'Resolve frontend-platform coordination gap',              source: 'Meeting notes — Mar 25 standup',   assignee: 'Unassigned', risk: 'Process gap'  },
    { id: 'T-043', priority: 'medium', title: 'Review and approve pending weekly digest send',           source: 'Approval queue — pending 6h',       assignee: 'A. Kim',    risk: null },
    { id: 'T-044', priority: 'medium', title: 'Follow up on authentication refactor rollout plan',       source: 'Thursday standup notes — Mar 27',   assignee: 'M. Chen',   risk: null },
    { id: 'T-045', priority: 'low',    title: 'Archive resolved Q1 doc updates in signal sources',      source: 'Weekly summary close-out',          assignee: 'Unassigned', risk: null },
  ];

  const pCfg = {
    high:   { label: 'HIGH',   color: '#EF4444', bg: 'rgba(239,68,68,0.08)',   bd: 'rgba(239,68,68,0.2)' },
    medium: { label: 'MED',    color: '#D97706', bg: 'rgba(217,119,6,0.08)',   bd: 'rgba(217,119,6,0.2)' },
    low:    { label: 'LOW',    color: 'var(--muted-foreground)', bg: 'var(--muted)', bd: 'var(--border)' },
  } as const;

  return (
    <div className="divide-y divide-border">
      {/* Header */}
      <div className="px-8 py-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-base font-semibold text-foreground mb-1">Suggested Tasks</div>
          <p className="text-xs text-muted-foreground">Surfaced from this week's signals and meeting records. No task auto-executes.</p>
        </div>
        <span
          className="text-[10px] font-mono px-2.5 py-1 rounded"
          style={{ color: 'var(--muted-foreground)', background: 'var(--muted)', border: '1px solid var(--border)' }}
        >
          5 tasks · 2 require decision
        </span>
      </div>

      {/* Usage chart — honest, internal signals only */}
      <div className="px-8 py-6">
        <div className="flex items-center gap-2 mb-4">
          <TrendingUp className="size-3.5 text-amber-500" strokeWidth={1.5} />
          <span className="text-sm font-medium" style={{ color: '#D97706' }}>API Usage Signals</span>
          <span className="ml-auto text-[10px] font-mono text-muted-foreground">Mar 24 – Mar 28</span>
        </div>
        <div className="flex flex-col gap-2.5">
          {[
            { service: 'Auth API',   used: 78 },
            { service: 'Data API',   used: 62 },
            { service: 'Notify API', used: 41 },
            { service: 'Search API', used: 27 },
          ].map(row => (
            <div key={row.service} className="flex items-center gap-3">
              <span className="text-xs font-mono text-muted-foreground" style={{ width: '72px', flexShrink: 0 }}>{row.service}</span>
              <div className="flex-1 h-1 rounded-full" style={{ background: 'var(--border)' }}>
                <div
                  className="h-1 rounded-full"
                  style={{
                    width: `${row.used}%`,
                    background: row.used > 75 ? 'var(--primary)' : row.used > 55 ? '#D97706' : '#22C55E',
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
              <span className="text-xs font-mono text-muted-foreground text-right" style={{ width: '30px', flexShrink: 0 }}>{row.used}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Task table */}
      <div>
        {tasks.map((task, i) => {
          const p = pCfg[task.priority as keyof typeof pCfg];
          return (
            <div
              key={task.id}
              className="flex items-start gap-3 px-8 py-4 transition-colors duration-150 cursor-pointer group"
              style={{
                borderBottom: i < tasks.length - 1 ? '1px solid var(--border)' : 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--muted)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <span
                className="text-[9px] font-mono font-medium px-1.5 py-0.5 rounded shrink-0 mt-0.5"
                style={{ color: p.color, background: p.bg, border: `1px solid ${p.bd}` }}
              >
                {p.label}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground mb-0.5">{task.title}</div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-xs text-muted-foreground">{task.source}</span>
                  {task.risk && (
                    <span
                      className="text-[10px] font-mono px-1.5 py-px rounded"
                      style={{ color: '#D97706', background: 'rgba(217,119,6,0.08)', border: '1px solid rgba(217,119,6,0.2)' }}
                    >
                      {task.risk}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-muted-foreground hidden sm:block">{task.assignee}</span>
                <ChevronRight className="size-3.5 text-border group-hover:text-muted-foreground transition-colors duration-150" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Panel 3: Approval Queue ─────────────────────── */
function ApprovalsPanel() {
  const [decisions, setDecisions] = useState<Record<string, 'approved' | 'denied'>>({});

  const pending = [
    {
      id: 'ACT-019',
      action: 'POST /api/notify/digest',
      desc: 'Send weekly engineering digest to team distribution list (12 recipients)',
      requester: 'Summary Worker · Authrix',
      queued: '6 hours ago',
      risk: 'Low impact',
    },
    {
      id: 'ACT-020',
      action: 'POST /api/workflows/trigger',
      desc: 'Trigger standup summary workflow for Thursday meeting notes',
      requester: 'Signal Worker · Authrix',
      queued: '2 hours ago',
      risk: 'Low impact',
    },
  ];

  const log = [
    { id: 'ACT-018', status: 'approved', action: 'Send weekly digest to #eng-ops channel',      actor: 'A. Kim',  time: '1w ago' },
    { id: 'ACT-017', status: 'approved', action: 'Trigger doc sync for Q1 architecture notes',  actor: 'M. Chen', time: '1w ago' },
    { id: 'ACT-016', status: 'denied',   action: 'Post unreviewed summary to external Slack',   actor: 'A. Kim',  time: '2w ago' },
    { id: 'ACT-015', status: 'approved', action: 'Send sprint close-out summary to leads',      actor: 'L. Park', time: '2w ago' },
  ];

  return (
    <div className="divide-y divide-border">
      {/* Header */}
      <div className="px-8 py-6 flex items-center justify-between flex-wrap gap-3">
        <div>
          <div className="text-base font-semibold text-foreground mb-1">Approval Queue</div>
          <p className="text-xs text-muted-foreground">External write actions require explicit human approval before execution.</p>
        </div>
        <span
          className="flex items-center gap-1.5 text-[10px] font-mono px-2.5 py-1 rounded"
          style={{ color: '#EF4444', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)' }}
        >
          <span className="size-1.5 rounded-full inline-block" style={{ background: '#EF4444' }} />
          2 pending
        </span>
      </div>

      {/* Pending approvals */}
      <div className="px-8 py-6 flex flex-col gap-4">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Awaiting approval</div>
        {pending.map(item => {
          const dec = decisions[item.id];
          return (
            <div
              key={item.id}
              className="rounded p-5 transition-colors duration-200"
              style={{
                border: `1px solid ${dec === 'approved' ? 'rgba(34,197,94,0.4)' : dec === 'denied' ? 'rgba(239,68,68,0.4)' : 'var(--border)'}`,
                background: dec === 'approved' ? 'rgba(34,197,94,0.04)' : dec === 'denied' ? 'rgba(239,68,68,0.04)' : 'var(--background)',
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className="text-[10px] font-mono px-1.5 py-px rounded"
                    style={{ color: 'var(--muted-foreground)', background: 'var(--muted)', border: '1px solid var(--border)' }}
                  >
                    {item.id}
                  </span>
                  <code
                    className="text-xs px-2 py-0.5 rounded font-mono"
                    style={{ color: 'var(--primary)', background: 'color-mix(in srgb, var(--primary) 8%, transparent)' }}
                  >
                    {item.action}
                  </code>
                  <span
                    className="text-[10px] font-mono px-1.5 py-px rounded"
                    style={{ color: '#22C55E', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.2)' }}
                  >
                    {item.risk}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="size-3" />
                  {item.queued}
                </div>
              </div>

              <p className="text-sm text-foreground mb-1.5">{item.desc}</p>
              <div className="flex items-center gap-1.5 text-muted-foreground mb-4">
                <User className="size-3" />
                <span className="text-xs font-mono">{item.requester}</span>
              </div>

              {!dec ? (
                <div className="flex gap-2 flex-wrap">
                  <button
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded border transition-all duration-150"
                    style={{ color: '#22C55E', border: '1px solid rgba(34,197,94,0.3)', background: 'transparent' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(34,197,94,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => setDecisions(d => ({ ...d, [item.id]: 'approved' }))}
                  >
                    <CheckCircle2 className="size-3.5" /> Approve
                  </button>
                  <button
                    className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-medium rounded border transition-all duration-150"
                    style={{ color: '#EF4444', border: '1px solid rgba(239,68,68,0.3)', background: 'transparent' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => setDecisions(d => ({ ...d, [item.id]: 'denied' }))}
                  >
                    <XCircle className="size-3.5" /> Deny
                  </button>
                  <button className="px-4 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors duration-150">
                    View details
                  </button>
                </div>
              ) : (
                <div
                  className="flex items-center gap-2 text-sm font-medium"
                  style={{ color: dec === 'approved' ? '#22C55E' : '#EF4444' }}
                >
                  {dec === 'approved' ? <CheckCircle2 className="size-4" /> : <XCircle className="size-4" />}
                  {dec === 'approved' ? 'Approved — action queued for execution' : 'Denied — action blocked, outcome recorded'}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Decision log */}
      <div className="px-8 py-5">
        <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground mb-3">
          Recent approval decisions
        </div>
        <div className="rounded overflow-hidden" style={{ border: '1px solid var(--border)' }}>
          {log.map((entry, i) => (
            <div
              key={entry.id}
              className="flex items-center gap-3 px-4 py-3 transition-colors duration-100"
              style={{
                borderBottom: i < log.length - 1 ? '1px solid var(--border)' : 'none',
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--muted)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              {entry.status === 'approved'
                ? <CheckCircle2 className="size-3.5 shrink-0" style={{ color: '#22C55E' }} />
                : <XCircle className="size-3.5 shrink-0" style={{ color: '#EF4444' }} />
              }
              <span className="text-[10px] font-mono text-muted-foreground shrink-0 hidden sm:block">{entry.id}</span>
              <span className="text-xs text-foreground flex-1 min-w-0 truncate">{entry.action}</span>
              <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">{entry.actor}</span>
              <span className="text-[10px] font-mono text-muted-foreground shrink-0">{entry.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Underline tab component ─────────────────────── */
function TabBar({ active, setActive }: { active: string; setActive: (t: string) => void }) {
  const tabs = [
    { id: 'summary',   icon: FileText,      label: 'Weekly Summary' },
    { id: 'tasks',     icon: CheckSquare,   label: 'Suggested Tasks' },
    { id: 'approvals', icon: ClipboardList, label: 'Approval Queue' },
  ];
  return (
    <div
      className="flex border-b border-border"
      style={{ background: 'var(--card)' }}
    >
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActive(tab.id)}
          className="relative flex items-center gap-2 px-5 py-3.5 text-sm transition-colors duration-150"
          style={{
            color: active === tab.id ? 'var(--foreground)' : 'var(--muted-foreground)',
            background: 'transparent',
            border: 'none',
          }}
          onMouseEnter={e => { if (active !== tab.id) { (e.currentTarget as HTMLButtonElement).style.color = 'var(--foreground)'; } }}
          onMouseLeave={e => { if (active !== tab.id) { (e.currentTarget as HTMLButtonElement).style.color = 'var(--muted-foreground)'; } }}
        >
          <tab.icon className="size-3.5" strokeWidth={1.5} />
          {tab.label}
          {/* Active underline */}
          {active === tab.id && (
            <span
              className="absolute bottom-0 left-5 right-5 h-px"
              style={{ background: 'var(--primary)' }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

/* ── Main export ─────────────────────────────────── */
export function ProductProof() {
  const [active, setActive] = useState('summary');

  return (
    <section
      id="product"
      className="py-28 px-6"
      style={{
        fontFamily: 'Inter, sans-serif',
        background: 'var(--card)',
        borderTop: '1px solid var(--border)',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <div className="max-w-7xl mx-auto">

        {/* Section header */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 mb-12">
          <div className="lg:col-span-5">
            <div className="text-[10px] font-mono uppercase tracking-widest text-primary mb-5">
              Product
            </div>
            <h2
              className="font-semibold text-foreground"
              style={{ fontSize: 'clamp(1.6rem, 2.6vw, 2.4rem)', lineHeight: 1.2, letterSpacing: '-0.02em' }}
            >
              The operating record, kept visible
            </h2>
          </div>
          <div className="lg:col-span-6 lg:col-start-7 flex items-end">
            <p className="text-muted-foreground leading-relaxed" style={{ fontSize: '15px' }}>
              Weekly summaries from your actual engineering footprint. Suggested tasks
              surfaced from signals. External actions routed through an approval queue
              before anything executes.
            </p>
          </div>
        </div>

        {/* Tab interface */}
        <div
          className="rounded overflow-hidden"
          style={{ border: '1px solid var(--border)' }}
        >
          <TabBar active={active} setActive={setActive} />
          {active === 'summary'   && <SummaryPanel />}
          {active === 'tasks'     && <TasksPanel />}
          {active === 'approvals' && <ApprovalsPanel />}
        </div>
      </div>
    </section>
  );
}