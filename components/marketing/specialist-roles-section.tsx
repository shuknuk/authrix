"use client";

import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

interface Specialist {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  tags: string[];
  icon: ({ className }: { className?: string }) => ReactNode;
  featured?: boolean;
}

const SPECIALISTS: Specialist[] = [
  {
    id: "engineer",
    title: "Engineer",
    subtitle: "Code and Architecture",
    description: "Analyzes GitHub activity to generate weekly engineering summaries",
    tags: ["Code Review", "Architecture", "Risk Detection"],
    icon: EngineerIcon,
  },
  {
    id: "docs",
    title: "Docs",
    subtitle: "Records and Decisions",
    description: "Processes meeting transcripts and notes to extract decisions and action items",
    tags: ["Meeting Notes", "Decisions", "Documentation"],
    icon: DocsIcon,
  },
  {
    id: "workflow",
    title: "Workflow",
    subtitle: "Ownership and Follow-through",
    description: "Manages ownership assignments and tracks follow-through on tasks",
    tags: ["Task Routing", "Ownership", "Execution"],
    icon: WorkflowIcon,
    featured: true,
  },
  {
    id: "devops",
    title: "DevOps",
    subtitle: "Posture and Spend",
    description: "Monitors costs and spend patterns to detect anomalies and risks",
    tags: ["Cost Analysis", "Anomaly Detection", "Budget"],
    icon: DevOpsIcon,
  },
];

export function SpecialistRolesSection() {
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
      id="specialists"
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
            The Specialist Roster
          </p>
          <h2 className="font-display text-[clamp(1.75rem,4vw,2.75rem)] font-medium leading-[1.1] text-[var(--foreground)]">
            Four agents. One operating view.
          </h2>
        </div>

        {/* Specialist Cards Grid */}
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {SPECIALISTS.map((specialist, index) => {
            const Icon = specialist.icon;
            const isFeatured = specialist.featured;

            return (
              <article
                key={specialist.id}
                className={`group relative overflow-hidden rounded-2xl border p-6 transition-all duration-700 hover:scale-[1.02] ${
                  isFeatured
                    ? "border-[var(--primary)]/50 bg-[#1a1a1a] shadow-xl shadow-[var(--primary)]/10"
                    : "border-[var(--border-strong)] bg-[#1c1c1c] hover:border-[var(--border)]"
                } ${isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"}`}
                style={{ transitionDelay: `${200 + index * 100}ms` }}
              >
                {/* Featured indicator */}
                {isFeatured && (
                  <div className="absolute right-4 top-4">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)]">
                      <svg
                        className="h-3 w-3 text-white"
                        fill="currentColor"
                        viewBox="0 0 12 12"
                      >
                        <path d="M6 0L7.854 4.146L12 6L7.854 7.854L6 12L4.146 7.854L0 6L4.146 4.146L6 0Z" />
                      </svg>
                    </div>
                  </div>
                )}

                {/* Icon */}
                <div
                  className={`mb-5 inline-flex rounded-xl p-3 ${
                    isFeatured
                      ? "bg-[var(--primary)]/20 text-[var(--primary)]"
                      : "bg-white/5 text-white/70"
                  }`}
                >
                  <Icon className="h-6 w-6" />
                </div>

                {/* Title */}
                <h3
                  className={`mb-1 font-display text-lg font-medium ${
                    isFeatured ? "text-[var(--primary)]" : "text-white"
                  }`}
                >
                  {specialist.title}
                </h3>

                {/* Subtitle */}
                <p className="mb-3 text-sm text-white/70">{specialist.subtitle}</p>

                {/* Description */}
                <p className="mb-6 text-sm leading-relaxed text-white/80">
                  {specialist.description}
                </p>

                {/* Tags */}
                <div className="flex flex-wrap gap-2">
                  {specialist.tags.map((tag) => (
                    <span
                      key={tag}
                      className={`rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide ${
                        isFeatured
                          ? "bg-[var(--primary)]/20 text-[var(--primary)]"
                          : "bg-white/10 text-white/50"
                      }`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                {/* Bottom accent line for featured */}
                {isFeatured && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--primary)] to-[var(--primary)]/50" />
                )}
              </article>
            );
          })}
        </div>

        {/* Bottom description */}
        <div
          className={`mt-12 text-center transition-all duration-700 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
          }`}
          style={{ transitionDelay: "600ms" }}
        >
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-[var(--foreground-muted)]">
            Each specialist focuses on a specific domain, collaborating to surface insights
            that would otherwise require constant manual review across tools.
          </p>
        </div>
      </div>
    </section>
  );
}

// Icon Components
function EngineerIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
    </svg>
  );
}

function DocsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
    </svg>
  );
}

function WorkflowIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function DevOpsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18L9 11.25l4.306 4.307a11.95 11.95 0 015.814-5.519l2.74-1.22m0 0l-5.94-2.28m5.94 2.28l-2.28 5.941" />
    </svg>
  );
}
