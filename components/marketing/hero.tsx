"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { DesertCrab } from "@/components/brand/desert-crab";

interface HeroProps {
  authReady?: boolean;
}

export function Hero({ authReady = false }: HeroProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    const handleScroll = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const scrollProgress = Math.max(0, Math.min(1, -rect.top / rect.height));
        setScrollY(scrollProgress);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Parallax values
  const bgY = scrollY * 100;
  const contentOpacity = Math.max(0, 1 - scrollY * 1.5);
  const contentY = scrollY * 50;

  return (
    <section
      ref={containerRef}
      className="relative min-h-[110vh] overflow-hidden"
    >
      {/* Background Image with Parallax */}
      <div
        className="absolute inset-0 will-change-transform"
        style={{
          transform: `translate3d(0, ${bgY}px, 0) scale(1.1)`,
        }}
      >
        <Image
          src="/desert-hero.png"
          alt="Desert landscape"
          fill
          className="object-cover object-center"
          priority
          quality={90}
        />
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-black/10 to-black/40" />

      {/* Content */}
      <div
        className="relative z-10 flex min-h-screen flex-col items-center justify-center px-5 pt-16"
        style={{
          opacity: contentOpacity,
          transform: `translate3d(0, ${contentY}px, 0)`,
        }}
      >
        <div className="mx-auto max-w-4xl text-center">
          {/* Eyebrow */}
          <p
            className={`mb-6 text-xs font-medium uppercase tracking-[0.2em] text-white/70 transition-all duration-700 ${
              mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
            style={{ transitionDelay: "200ms" }}
          >
            Governed Startup Operations
          </p>

          {/* Headline */}
          <h1
            className={`font-display text-[clamp(2.5rem,7vw,4.5rem)] font-medium leading-[1.05] text-white transition-all duration-700 ${
              mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
            style={{ transitionDelay: "350ms" }}
          >
            The control layer for
            <br />
            reviewable engineering.
          </h1>

          {/* Subtitle */}
          <p
            className={`mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-white/80 transition-all duration-700 ${
              mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
            style={{ transitionDelay: "500ms" }}
          >
            Authrix gives teams one place to review weekly summaries, follow-up work,
            spend posture, and approval-gated actions before anything writes outward.
          </p>

          {/* CTA Buttons */}
          <div
            className={`mt-10 flex flex-wrap items-center justify-center gap-4 transition-all duration-700 ${
              mounted ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
            }`}
            style={{ transitionDelay: "650ms" }}
          >
            <a
              href="#cta"
              className="group inline-flex items-center gap-2 rounded-full bg-white/95 px-6 py-3 text-sm font-medium text-[var(--ink)] shadow-lg shadow-black/20 transition-all hover:bg-white hover:shadow-xl hover:shadow-black/30 hover:-translate-y-0.5"
            >
              Request Access
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
              href="#product"
              className="inline-flex items-center gap-2 rounded-full bg-white/10 px-6 py-3 text-sm font-medium text-white backdrop-blur-sm ring-1 ring-white/20 transition-all hover:bg-white/15 hover:ring-white/30"
            >
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
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                />
              </svg>
              See Product
            </a>
          </div>

          {/* Auth notice */}
          {!authReady && (
            <p
              className={`mt-8 text-xs text-white/50 transition-all duration-700 ${
                mounted ? "opacity-100" : "opacity-0"
              }`}
              style={{ transitionDelay: "800ms" }}
            >
              Auth0 sign-in is not configured in this environment.
              <br />
              The demo still reflects the real approval-gated operating model.
            </p>
          )}
        </div>
      </div>

      {/* Bottom fade to next section */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--ivory)] to-transparent" />

      {/* Decorative Crab walking across bottom edge */}
      <div
        className={`absolute bottom-8 left-4 z-20 transition-all duration-1000 ${
          mounted ? "translate-x-0 opacity-100" : "-translate-x-8 opacity-0"
        }`}
        style={{ transitionDelay: "1000ms" }}
      >
        <DesertCrab size="md" variant="filled" />
      </div>

      {/* Second crab peeking from right */}
      <div
        className={`absolute bottom-12 right-8 z-20 transition-all duration-1000 ${
          mounted ? "translate-y-0 opacity-80" : "translate-y-4 opacity-0"
        }`}
        style={{ transitionDelay: "1200ms" }}
      >
        <DesertCrab size="sm" variant="ghost" />
      </div>
    </section>
  );
}
