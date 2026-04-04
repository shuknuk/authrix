import type { ReactNode } from "react";

interface StatusPillProps {
  children: ReactNode;
  tone?: "neutral" | "info" | "warning" | "danger" | "success";
  size?: "sm" | "md";
}

export function StatusPill({
  children,
  tone = "neutral",
  size = "md",
}: StatusPillProps) {
  const toneClasses = {
    neutral:
      "border-[var(--border)] bg-[var(--background-muted)] text-[var(--foreground-muted)]",
    info: "border-[var(--info-border)] bg-[var(--info-soft)] text-[var(--info)]",
    warning:
      "border-[var(--warning-border)] bg-[var(--warning-soft)] text-[var(--clay)]",
    danger:
      "border-[var(--danger-border)] bg-[var(--danger-soft)] text-[var(--danger)]",
    success:
      "border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success)]",
  } satisfies Record<NonNullable<StatusPillProps["tone"]>, string>;

  const sizeClasses =
    size === "sm"
      ? "px-2 py-0.5 text-[10px]"
      : "px-2.5 py-1 text-[11px]";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border font-medium ${toneClasses[tone]} ${sizeClasses}`}
    >
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          tone === "neutral"
            ? "bg-[var(--foreground-muted)]"
            : tone === "info"
            ? "bg-[var(--info)]"
            : tone === "warning"
            ? "bg-[var(--clay)]"
            : tone === "danger"
            ? "bg-[var(--danger)]"
            : "bg-[var(--success)]"
        }`}
      />
      {children}
    </span>
  );
}
