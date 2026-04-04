import type { ReactNode } from "react";

interface SectionFrameProps {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}

export function SectionFrame({
  title,
  description,
  action,
  children,
}: SectionFrameProps) {
  return (
    <section className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <h2 className="font-display text-xl font-medium text-[var(--foreground)]">
            {title}
          </h2>
          {description ? (
            <p className="max-w-2xl text-sm text-[var(--foreground-muted)]">
              {description}
            </p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}
