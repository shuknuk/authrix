"use client";

import { useEffect, useRef, useState } from "react";
import { DesertCrab } from "@/components/brand/desert-crab";

export function CTASection() {
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
      id="pricing"
      ref={sectionRef}
      className="relative overflow-hidden bg-[var(--cream)] px-5 py-24 md:px-8 md:py-32"
    >
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -left-1/4 -top-1/4 h-1/2 w-1/2 rounded-full bg-[var(--primary)]/5 blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 h-1/2 w-1/2 rounded-full bg-[var(--bronze)]/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-3xl text-center">
        <div
          className={`transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
        >
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.15em] text-[var(--primary)]">
            Get Started
          </p>

          <h2 className="font-display text-[clamp(2rem,5vw,3rem)] font-medium leading-[1.1] text-[var(--foreground)]">
            Ready to add reviewable operations?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-[var(--foreground-muted)]">
            If your team needs reviewable operations without hidden automation, this is the
            product direction.
          </p>
        </div>

        <div
          className={`relative mt-10 flex flex-wrap items-center justify-center gap-4 transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
          style={{ transitionDelay: "200ms" }}
        >
          <a
            href="#"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--primary)] px-8 py-4 text-sm font-medium text-[var(--primary-foreground)] shadow-lg shadow-[var(--primary)]/20 transition-all hover:bg-[var(--bronze)] hover:shadow-xl hover:shadow-[var(--primary)]/30 hover:-translate-y-0.5"
          >
            Request Early Access
            <svg
              className="h-4 w-4"
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
            href="mailto:hello@authrix.io"
            className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)] px-8 py-4 text-sm font-medium text-[var(--foreground)] transition-all hover:border-[var(--border-strong)] hover:bg-[var(--background-elevated)]"
          >
            Contact Sales
          </a>

          {/* Peeking crab behind CTA */}
          <div
            className={`absolute -left-12 top-1/2 -translate-y-1/2 transition-all duration-1000 ${
              isVisible ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
            }`}
            style={{ transitionDelay: "600ms" }}
            aria-hidden="true"
          >
            <DesertCrab size="lg" variant="ghost" />
          </div>
        </div>

        <div
          className={`mt-16 border-t border-[var(--border)] pt-8 transition-all duration-700 ${
            isVisible ? "opacity-100" : "opacity-0"
          }`}
          style={{ transitionDelay: "400ms" }}
        >
          <p className="text-xs text-[var(--foreground-muted)]">
            Authrix MVP · Auth0 delegated identity · approval-gated writes · demo-safe mock states
          </p>
        </div>
      </div>

      {/* Decorative crab in bottom right corner */}
      <div
        className={`absolute bottom-6 right-6 transition-all duration-1000 ${
          isVisible ? "translate-y-0 opacity-60" : "translate-y-4 opacity-0"
        }`}
        style={{ transitionDelay: "800ms" }}
        aria-hidden="true"
      >
        <DesertCrab size="sm" variant="ghost" />
      </div>
    </section>
  );
}
