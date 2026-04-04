"use client";

import { useEffect, useRef, useState } from "react";

const STEPS = [
  {
    step: "01",
    title: "Collect engineering activity",
    description:
      "GitHub and workspace records are ingested into a normalized weekly operating view.",
  },
  {
    step: "02",
    title: "Generate the weekly review",
    description:
      "Authrix creates a structured summary with movement, context, drift, and cost posture.",
  },
  {
    step: "03",
    title: "Propose follow-up work",
    description:
      "Suggested tasks and spend flags are surfaced with ownership, evidence, and due-date context.",
  },
  {
    step: "04",
    title: "Approve before writing",
    description:
      "Any external write action stays queued until a named operator records the decision.",
  },
] as const;

export function WorkflowSection() {
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
      id="solutions"
      ref={sectionRef}
      className="relative bg-[var(--cream)] px-5 py-24 md:px-8 md:py-32"
    >
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div
          className={`mb-16 max-w-2xl transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.15em] text-[var(--foreground-muted)]">
            Workflow
          </p>
          <h2 className="font-display text-[clamp(1.75rem,4vw,2.75rem)] font-medium leading-[1.1] text-[var(--foreground)]">
            Four steps from signal intake to governed execution.
          </h2>
        </div>

        {/* Steps Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {STEPS.map((item, index) => (
            <article
              key={item.step}
              className={`group relative overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)] p-6 transition-all duration-700 hover:border-[var(--border-strong)] hover:shadow-lg ${
                isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
              }`}
              style={{ transitionDelay: `${200 + index * 100}ms` }}
            >
              {/* Step Number */}
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-xs font-medium tracking-wider text-[var(--primary)]">
                  Step {item.step}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--sand)]/50 text-sm font-medium text-[var(--foreground-muted)] transition-colors group-hover:bg-[var(--primary)]/10 group-hover:text-[var(--primary)]">
                  {index + 1}
                </div>
              </div>

              {/* Content */}
              <h3 className="mb-2 text-xl font-medium text-[var(--foreground)]">
                {item.title}
              </h3>
              <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                {item.description}
              </p>

              {/* Decorative line */}
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-[var(--primary)] transition-all duration-500 group-hover:w-full" />
            </article>
          ))}
        </div>

        {/* Connecting line for desktop */}
        <div className="relative mx-auto mt-8 hidden max-w-4xl md:block">
          <div className="absolute left-0 right-0 top-1/2 h-px -translate-y-1/2 bg-gradient-to-r from-transparent via-[var(--border-strong)] to-transparent" />
        </div>
      </div>
    </section>
  );
}
