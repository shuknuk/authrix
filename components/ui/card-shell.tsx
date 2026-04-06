import type { ReactNode } from "react";

interface CardShellProps {
  title: string;
  description?: string;
  badge?: ReactNode;
  tone?: "default" | "accent" | "warning" | "danger" | "success";
  meta?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
}

export function CardShell({
  title,
  description,
  badge,
  tone = "default",
  meta,
  actions,
  footer,
  children,
}: CardShellProps) {
  const toneClasses = {
    default: "border-[var(--border)] bg-[var(--card)]",
    accent: "border-[var(--primary-border)] bg-[var(--primary-muted)]",
    warning: "border-[var(--warning-border)] bg-[var(--warning-soft)]",
    danger: "border-[var(--danger-border)] bg-[var(--danger-soft)]",
    success: "border-[var(--success-border)] bg-[var(--success-soft)]",
  } satisfies Record<NonNullable<CardShellProps["tone"]>, string>;

  return (
    <div
      className={`overflow-hidden rounded-xl border shadow-sm transition-all hover:shadow-md ${toneClasses[tone]}`}
    >
      <div className="border-b border-[var(--border-subtle)] px-5 py-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1 space-y-1">
            <h3 className="font-display text-lg font-medium text-[var(--foreground)] truncate">
              {title}
            </h3>
            {description ? (
              <p className="max-w-xl text-sm text-[var(--foreground-muted)] line-clamp-2">
                {description}
              </p>
            ) : null}
            {meta ? <div className="mt-2 flex flex-wrap gap-2">{meta}</div> : null}
          </div>
          <div className="flex shrink-0 items-start gap-2">
            {actions ?? badge}
          </div>
        </div>
      </div>

      <div className="p-5">{children}</div>

      {footer ? (
        <div className="border-t border-[var(--border-subtle)] bg-[var(--background-elevated)] px-5 py-3">
          {footer}
        </div>
      ) : null}
    </div>
  );
}
