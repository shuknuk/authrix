"use client";

import { useEffect, useRef, useState } from "react";

const CHECKPOINTS = [
  "Recommendation generated",
  "Action enters approval queue",
  "Named operator reviews",
  "Approved action executes",
  "Outcome recorded",
] as const;

const FEATURES = [
  {
    title: "Approval before writes",
    description: "External actions stay pending until a person approves the decision.",
  },
  {
    title: "Reviewable trail",
    description: "Summary source, recommendation, decision, and outcome remain visible.",
  },
  {
    title: "Spend visibility",
    description: "Weekly cost posture and anomalies appear beside follow-up work.",
  },
] as const;

export function GovernanceSection() {
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
            Governance
          </p>
          <h2 className="font-display text-[clamp(1.75rem,4vw,2.75rem)] font-medium leading-[1.1] text-[var(--foreground)]">
            Review is explicit. Approval is mandatory. Outcomes stay visible.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-[var(--foreground-muted)]">
            Authrix does not imply autonomous security guarantees. It keeps the queue,
            decision, and execution result inspectable so operators can trust what happened.
          </p>
        </div>

        {/* Two Column Layout */}
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left: Review Path */}
          <div
            className={`rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)] p-6 transition-all duration-700 ${
              isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            <h3 className="mb-6 text-xs font-medium uppercase tracking-wide text-[var(--foreground-muted)]">
              Review Path
            </h3>

            <ol className="space-y-4">
              {CHECKPOINTS.map((item, index) => (
                <li key={item} className="flex items-start gap-4">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--cream)] text-xs font-medium text-[var(--foreground-muted)]">
                    {index + 1}
                  </span>
                  <span className="pt-1 text-sm text-[var(--foreground-soft)]">{item}</span>
                </li>
              ))}
            </ol>
          </div>

          {/* Right: Feature Cards */}
          <div className="space-y-4">
            {FEATURES.map((feature, index) => (
              <div
                key={feature.title}
                className={`rounded-2xl border border-[var(--border)] bg-[var(--background-elevated)] p-6 transition-all duration-700 hover:border-[var(--border-strong)] hover:shadow-md ${
                  isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
                }`}
                style={{ transitionDelay: `${300 + index * 100}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10">
                    <svg
                      className="h-5 w-5 text-[var(--primary)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      {index === 0 && (
                        <>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </>
                      )}
                      {index === 1 && (
                        <>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </>
                      )}
                      {index === 2 && (
                        <>
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </>
                      )}
                    </svg>
                  </div>
                  <div>
                    <h4 className="mb-1 text-sm font-medium text-[var(--foreground)]">
                      {feature.title}
                    </h4>
                    <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
