import type { ReactNode } from "react";

interface PageHeaderProps {
  title: string;
  description: string;
  eyebrow?: string;
  badge?: string;
  status?: ReactNode;
  actions?: ReactNode;
}

export function PageHeader({
  title,
  description,
  eyebrow = "Authrix Workspace",
  badge,
  status,
  actions,
}: PageHeaderProps) {
  return (
    <header className="mb-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-xs font-medium uppercase tracking-[0.15em] text-[var(--foreground-muted)]">
              {eyebrow}
            </p>
            {badge ? (
              <span className="rounded-full border border-[var(--border)] bg-[var(--background-elevated)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--foreground-muted)]">
                {badge}
              </span>
            ) : null}
          </div>

          <h1 className="font-display text-[clamp(1.75rem,3.5vw,2.5rem)] font-medium leading-[1.1] text-[var(--foreground)]">
            {title}
          </h1>
          <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
            {description}
          </p>
        </div>

        {status || actions ? (
          <div className="flex flex-col items-start gap-3 lg:items-end">
            {status ? (
              <div className="flex flex-wrap items-center gap-2">{status}</div>
            ) : null}
            {actions}
          </div>
        ) : null}
      </div>
    </header>
  );
}
