"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export function ProductProof() {
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
      { threshold: 0.2 }
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
      className="relative bg-[var(--ivory)] px-5 py-24 md:px-8 md:py-32"
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div
          className={`mb-16 max-w-2xl transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.15em] text-[var(--foreground-muted)]">
            Product Preview
          </p>
          <h2 className="font-display text-[clamp(1.75rem,4vw,2.75rem)] font-medium leading-[1.1] text-[var(--foreground)]">
            One review surface for summary, follow-up, spend, and approvals.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--foreground-muted)]">
            The core workflow stays visible in one place: signals are summarized, tasks are
            proposed, cost posture is readable, and write actions wait for explicit approval.
          </p>
        </div>

        {/* Dashboard Preview */}
        <div
          className={`relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--cream)] shadow-xl transition-all duration-1000 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
          style={{ transitionDelay: "200ms" }}
        >
          {/* Mock Browser Chrome */}
          <div className="flex items-center gap-2 border-b border-[var(--border)] bg-[var(--sand)]/30 px-4 py-3">
            <div className="flex gap-1.5">
              <div className="h-3 w-3 rounded-full bg-[var(--danger)]/60" />
              <div className="h-3 w-3 rounded-full bg-[var(--warning)]/60" />
              <div className="h-3 w-3 rounded-full bg-[var(--success)]/60" />
            </div>
            <div className="ml-4 flex-1">
              <div className="mx-auto max-w-md rounded-md bg-[var(--card)]/50 px-3 py-1.5 text-center text-xs text-[var(--foreground-muted)]">
                authrix.io/dashboard
              </div>
            </div>
          </div>

          {/* Dashboard Content Preview */}
          <div className="grid grid-cols-1 gap-6 p-6 lg:grid-cols-12 lg:gap-8">
            {/* Left: Main Content */}
            <div className="space-y-6 lg:col-span-8">
              {/* Summary Card */}
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-3">
                  <div className="h-8 w-8 rounded-lg bg-[var(--primary)]/10 flex items-center justify-center">
                    <svg className="h-4 w-4 text-[var(--primary)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-[var(--foreground)]">Weekly Summary</h3>
                    <p className="text-xs text-[var(--foreground-muted)]">Week of March 24-30</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="h-2 w-full rounded bg-[var(--sand)]" />
                  <div className="h-2 w-[90%] rounded bg-[var(--sand)]" />
                  <div className="h-2 w-[75%] rounded bg-[var(--sand)]" />
                </div>
              </div>

              {/* Tasks Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[var(--warning)]" />
                    <span className="text-xs font-medium text-[var(--foreground-muted)]">Open Tasks</span>
                  </div>
                  <p className="text-2xl font-semibold text-[var(--foreground)]">12</p>
                </div>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-[var(--danger)]" />
                    <span className="text-xs font-medium text-[var(--foreground-muted)]">Pending Approvals</span>
                  </div>
                  <p className="text-2xl font-semibold text-[var(--foreground)]">3</p>
                </div>
              </div>
            </div>

            {/* Right: Sidebar Info */}
            <div className="space-y-4 lg:col-span-4">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
                <h4 className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
                  Cost Posture
                </h4>
                <div className="mb-2 flex items-end justify-between">
                  <span className="text-2xl font-semibold text-[var(--foreground)]">$2.4k</span>
                  <span className="text-xs text-[var(--success)]">On track</span>
                </div>
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-[var(--sand)]">
                  <div className="h-full w-[65%] rounded-full bg-[var(--success)]" />
                </div>
              </div>

              <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4 shadow-sm">
                <h4 className="mb-3 text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
                  Recent Activity
                </h4>
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-6 w-6 rounded-full bg-[var(--sand)]" />
                      <div className="flex-1">
                        <div className="h-2 w-20 rounded bg-[var(--sand)]" />
                        <div className="mt-1 h-1.5 w-12 rounded bg-[var(--sand)] opacity-60" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Feature Pills */}
        <div
          className={`mt-12 flex flex-wrap justify-center gap-3 transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
          style={{ transitionDelay: "400ms" }}
        >
          {[
            "Weekly Summaries",
            "Task Recommendations",
            "Cost Monitoring",
            "Approval Workflows",
          ].map((feature) => (
            <span
              key={feature}
              className="rounded-full border border-[var(--border)] bg-[var(--card)] px-4 py-2 text-sm text-[var(--foreground-soft)] shadow-sm"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
