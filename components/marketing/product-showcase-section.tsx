"use client";

import { useEffect, useRef, useState } from "react";

export function ProductShowcaseSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      id="product"
      ref={sectionRef}
      className="relative overflow-hidden bg-[#0d0d0d] px-5 py-24 md:px-8 md:py-32"
    >
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a1a] via-[#0d0d0d] to-[#0d0d0d]" />
      <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-[var(--primary)]/5 blur-3xl" />

      <div className="relative mx-auto max-w-6xl">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left Content */}
          <div
            className={`transition-all duration-700 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            {/* Eyebrow */}
            <div className="mb-6 flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[var(--primary)]" />
              <span className="text-xs font-medium uppercase tracking-[0.15em] text-white/50">
                Governed Operations
              </span>
            </div>

            {/* Headline */}
            <h2 className="font-display text-[clamp(2rem,5vw,3.5rem)] font-medium leading-[1.1] text-white">
              Turn engineering
              <br />
              signals into{" "}
              <span className="text-[var(--primary)]">reviewable</span>
              <br />
              operational action.
            </h2>

            {/* Description */}
            <p className="mt-6 max-w-md text-base leading-relaxed text-white/50">
              Authrix turns engineering activity, meeting records, documentation
              updates, and usage signals into weekly reviews, follow-up work, spend
              visibility, and approval-gated actions.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a
                href="#cta"
                className="group inline-flex items-center gap-2 rounded-lg bg-[var(--primary)] px-5 py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-all hover:bg-[var(--primary)]/90"
              >
                Request Early Access
                <svg
                  className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </a>

              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-white/70 transition-all hover:bg-white/10 hover:text-white"
              >
                See how it works
              </a>
            </div>

            {/* Bottom section - Designed around */}
            <div className="mt-12 border-t border-white/10 pt-8">
              <p className="mb-4 text-xs font-medium uppercase tracking-[0.15em] text-white/40">
                Designed Around
              </p>
              <ul className="space-y-2">
                {[
                  "Approval-gated external actions",
                  "Delegated identity via Auth0",
                  "Audit-native workflows",
                  "Human-in-the-loop execution",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-center gap-2 text-sm text-white/60"
                  >
                    <span className="text-white/30">›</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Right Content - Dashboard Mock */}
          <div
            className={`transition-all duration-700 delay-200 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
          >
            <div className="relative overflow-hidden rounded-xl border border-white/10 bg-[#141414] shadow-2xl">
              {/* Browser Chrome */}
              <div className="flex items-center gap-2 border-b border-white/5 bg-[#1a1a1a] px-4 py-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-[#ff5f57]/80" />
                  <div className="h-3 w-3 rounded-full bg-[#febc2e]/80" />
                  <div className="h-3 w-3 rounded-full bg-[#28c840]/80" />
                </div>
                <div className="ml-4 flex flex-1 items-center justify-center gap-4">
                  <div className="flex items-center gap-1.5 rounded-md bg-[#0d0d0d] px-3 py-1.5 text-xs text-white/70">
                    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                    </svg>
                    Weekly Summary
                  </div>
                  <span className="text-xs text-white/40">Approvals</span>
                </div>
              </div>

              {/* Dashboard Content */}
              <div className="grid grid-cols-[180px_1fr]">
                {/* Sidebar */}
                <div className="border-r border-white/5 bg-[#141414] p-4">
                  {/* Logo */}
                  <div className="mb-6 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded bg-[var(--primary)]">
                      <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-white">Authrix</span>
                    <span className="ml-auto rounded bg-white/10 px-1.5 py-0.5 text-[9px] text-white/50">beta</span>
                  </div>

                  {/* Nav Items */}
                  <nav className="space-y-1">
                    <NavItem icon="chart" active>Weekly Summary</NavItem>
                    <NavItem icon="task" badge="4">Suggested Tasks</NavItem>
                    <NavItem icon="approval" badge="2" dangerBadge>Approval Queue</NavItem>
                    <NavItem icon="source">Signal Sources</NavItem>
                    <NavItem icon="settings">Settings</NavItem>
                  </nav>

                  {/* User */}
                  <div className="mt-8 flex items-center gap-2 border-t border-white/5 pt-4">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)]/20 text-[10px] font-medium text-[var(--primary)]">
                      AK
                    </div>
                    <div className="text-xs">
                      <p className="text-white/70">A. Kim</p>
                      <p className="text-white/40">Eng Lead</p>
                    </div>
                  </div>
                </div>

                {/* Main Content */}
                <div className="p-5">
                  {/* Header */}
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-white">Weekly Engineering Summary</h3>
                    <div className="mt-1 flex items-center gap-2 text-xs">
                      <span className="text-white/40">Mar 24-28, 2025</span>
                      <span className="rounded bg-[var(--primary)]/20 px-1.5 py-0.5 text-[var(--primary)]">AI generated</span>
                      <span className="rounded bg-green-500/20 px-1.5 py-0.5 text-green-400">Reviewed</span>
                    </div>
                  </div>

                  {/* Metrics Row */}
                  <div className="mb-4 grid grid-cols-3 gap-3">
                    <MetricCard
                      label="Usage Signals"
                      value="14%"
                      trend="up"
                      subtext="vs 4-week baseline"
                      accent
                    />
                    <MetricCard
                      label="Tasks Suggested"
                      value="4"
                      subtext="2 new this week"
                    />
                    <MetricCard
                      label="Pending Approval"
                      value="2"
                      subtext="action required"
                      warning
                    />
                  </div>

                  {/* Summary Box */}
                  <div className="mb-4 rounded-lg border border-white/5 bg-[#1a1a1a] p-4">
                    <p className="mb-2 text-[10px] uppercase tracking-wider text-white/40">Summary</p>
                    <p className="text-xs leading-relaxed text-white/70">
                      Five PRs merged across auth and payment services. Standup notes flagged a coordination gap. API usage up {" "}
                      <span className="text-[var(--primary)]">14%</span> above baseline. Two external actions pending approval.
                    </p>
                  </div>

                  {/* Notable Signals */}
                  <div className="rounded-lg border border-white/5 bg-[#1a1a1a] p-4">
                    <p className="mb-3 text-[10px] uppercase tracking-wider text-white/40">Notable Signals</p>
                    <div className="space-y-2">
                      <SignalRow icon="warning" text="API usage 14% above 4-week rolling baseline" />
                      <SignalRow icon="warning" text="2 approval requests pending — action required" />
                      <SignalRow icon="success" text="payment-service v1.8.2 merged · 0 test failures" />
                    </div>
                  </div>

                  {/* Suggested Tasks Footer */}
                  <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-3">
                    <span className="text-[10px] uppercase tracking-wider text-white/40">Suggested Tasks</span>
                    <a href="#" className="flex items-center gap-1 text-[10px] text-[var(--primary)] hover:underline">
                      view all →
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// Sidebar Nav Item
function NavItem({
  children,
  icon,
  active,
  badge,
  dangerBadge,
}: {
  children: React.ReactNode;
  icon: string;
  active?: boolean;
  badge?: string;
  dangerBadge?: boolean;
}) {
  const icons: Record<string, React.ReactNode> = {
    chart: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    task: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
      </svg>
    ),
    approval: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    source: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    settings: (
      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  };

  return (
    <a
      href="#"
      className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors ${
        active
          ? "bg-white/5 text-white"
          : "text-white/50 hover:bg-white/5 hover:text-white/70"
      }`}
    >
      {icons[icon]}
      <span className="flex-1">{children}</span>
      {badge && (
        <span
          className={`rounded px-1 py-0.5 text-[9px] ${
            dangerBadge
              ? "bg-red-500/20 text-red-400"
              : "bg-white/10 text-white/50"
          }`}
        >
          {badge}
        </span>
      )}
    </a>
  );
}

// Metric Card
function MetricCard({
  label,
  value,
  trend,
  subtext,
  accent,
  warning,
}: {
  label: string;
  value: string;
  trend?: "up" | "down";
  subtext: string;
  accent?: boolean;
  warning?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg border p-3 ${
        accent
          ? "border-[var(--primary)]/30 bg-[var(--primary)]/5"
          : warning
          ? "border-red-500/30 bg-red-500/5"
          : "border-white/5 bg-[#1a1a1a]"
      }`}
    >
      <p className="mb-1 text-[9px] uppercase tracking-wider text-white/40">
        {label}
      </p>
      <div className="flex items-baseline gap-1">
        {trend && (
          <span
            className={`text-xs ${
              trend === "up" ? "text-green-400" : "text-red-400"
            }`}
          >
            {trend === "up" ? "+" : "-"}
          </span>
        )}
        <span
          className={`text-xl font-semibold ${
            accent ? "text-[var(--primary)]" : warning ? "text-red-400" : "text-white"
          }`}
        >
          {value}
        </span>
      </div>
      <p className="mt-0.5 text-[9px] text-white/40">{subtext}</p>
      {accent && (
        <div className="absolute bottom-0 left-0 h-0.5 w-full bg-[var(--primary)]/50" />
      )}
      {warning && (
        <div className="absolute bottom-0 left-0 h-0.5 w-full bg-red-500/50" />
      )}
    </div>
  );
}

// Signal Row
function SignalRow({
  icon,
  text,
}: {
  icon: "warning" | "success";
  text: string;
}) {
  return (
    <div className="flex items-start gap-2 text-xs text-white/70">
      {icon === "warning" ? (
        <svg
          className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-[var(--primary)]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ) : (
        <svg
          className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-green-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      )}
      <span>{text}</span>
    </div>
  );
}
