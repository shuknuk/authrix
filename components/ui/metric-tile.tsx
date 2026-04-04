interface MetricTileProps {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "accent" | "warning" | "danger" | "success";
}

export function MetricTile({
  label,
  value,
  hint,
  tone = "default",
}: MetricTileProps) {
  const toneClasses = {
    default: "border-[var(--border)]",
    accent: "border-[var(--primary)]",
    warning: "border-[var(--warning)]",
    danger: "border-[var(--danger)]",
    success: "border-[var(--success)]",
  } satisfies Record<NonNullable<MetricTileProps["tone"]>, string>;

  return (
    <div
      className={`rounded-xl border bg-[var(--card)] p-5 shadow-sm transition-all hover:shadow-md ${toneClasses[tone]}`}
    >
      <p className="text-xs font-medium text-[var(--foreground-muted)]">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-[var(--foreground)]">{value}</p>
      {hint ? (
        <p className="mt-1 text-xs text-[var(--foreground-muted)]">{hint}</p>
      ) : null}
    </div>
  );
}
