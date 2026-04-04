import type { ReactNode } from "react";

export type SpecialistRole = "engineer" | "docs" | "workflow" | "devops";

type RoleMeta = {
  label: string;
  subtitle: string;
  tint: string;
  panel: string;
  iconClassName: string;
};

export const SPECIALIST_META: Record<SpecialistRole, RoleMeta> = {
  engineer: {
    label: "Engineer",
    subtitle: "Code and architecture",
    tint: "text-[var(--foreground)]",
    panel:
      "border-[color:color-mix(in_srgb,var(--primary)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--primary)_7%,transparent)]",
    iconClassName:
      "border-[color:color-mix(in_srgb,var(--primary)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--primary)_7%,transparent)] text-[var(--primary)]",
  },
  docs: {
    label: "Docs",
    subtitle: "Records and decisions",
    tint: "text-[var(--foreground)]",
    panel: "border-[var(--border)] bg-[var(--background-muted)]",
    iconClassName: "border-[var(--border)] bg-[var(--background)] text-[var(--muted-foreground)]",
  },
  workflow: {
    label: "Workflow",
    subtitle: "Ownership and follow-through",
    tint: "text-[var(--foreground)]",
    panel:
      "border-[color:color-mix(in_srgb,var(--primary)_26%,transparent)] bg-[color:color-mix(in_srgb,var(--primary)_9%,transparent)]",
    iconClassName:
      "border-[color:color-mix(in_srgb,var(--primary)_26%,transparent)] bg-[color:color-mix(in_srgb,var(--primary)_10%,transparent)] text-[var(--primary)]",
  },
  devops: {
    label: "DevOps",
    subtitle: "Posture and spend",
    tint: "text-[var(--foreground)]",
    panel:
      "border-[color:color-mix(in_srgb,var(--warning)_20%,transparent)] bg-[color:color-mix(in_srgb,var(--warning)_7%,transparent)]",
    iconClassName:
      "border-[color:color-mix(in_srgb,var(--warning)_18%,transparent)] bg-[color:color-mix(in_srgb,var(--warning)_8%,transparent)] text-[var(--warning)]",
  },
};

interface SpecialistCrabProps {
  role: SpecialistRole;
  size?: "sm" | "md";
  className?: string;
}

export function SpecialistCrab({
  role,
  size = "md",
  className = "",
}: SpecialistCrabProps) {
  const meta = SPECIALIST_META[role];
  const sizeClasses =
    size === "sm"
      ? "h-10 w-10 rounded-[var(--radius-sm)]"
      : "h-12 w-12 rounded-[var(--radius-sm)]";

  return (
    <span
      className={`inline-flex items-center justify-center border ${sizeClasses} ${meta.iconClassName} ${className}`.trim()}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 90 68"
        className={size === "sm" ? "h-5 w-5" : "h-6 w-6"}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <ellipse cx="45" cy="40" rx="22" ry="16" />
        <path d="M37 24 L45 17 L53 24" />
        <line x1="37" y1="25" x2="31" y2="18" />
        <circle cx="29.5" cy="16.5" r="2.5" fill="currentColor" stroke="none" />
        <line x1="53" y1="25" x2="59" y2="18" />
        <circle cx="60.5" cy="16.5" r="2.5" fill="currentColor" stroke="none" />
        <line x1="23" y1="33" x2="11" y2="26" />
        <line x1="11" y1="26" x2="5" y2="22" />
        <line x1="11" y1="26" x2="8" y2="30" />
        <line x1="67" y1="33" x2="79" y2="26" />
        <line x1="79" y1="26" x2="85" y2="22" />
        <line x1="79" y1="26" x2="82" y2="30" />
        <line x1="24" y1="37" x2="8" y2="36" />
        <line x1="23" y1="42" x2="7" y2="44" />
        <line x1="24" y1="47" x2="10" y2="53" />
        <line x1="66" y1="37" x2="82" y2="36" />
        <line x1="67" y1="42" x2="83" y2="44" />
        <line x1="66" y1="47" x2="80" y2="53" />
        {role === "engineer" ? (
          <>
            <circle cx="45" cy="38" r="1.8" fill="currentColor" stroke="none" opacity="0.75" />
            <circle cx="40" cy="45" r="1.8" fill="currentColor" stroke="none" opacity="0.75" />
            <circle cx="50" cy="45" r="1.8" fill="currentColor" stroke="none" opacity="0.75" />
            <line x1="45" y1="38" x2="40" y2="45" opacity="0.5" />
            <line x1="45" y1="38" x2="50" y2="45" opacity="0.5" />
            <line x1="40" y1="45" x2="50" y2="45" opacity="0.5" />
          </>
        ) : null}
        {role === "docs" ? (
          <>
            <rect x="39.5" y="33" width="11" height="14" rx="1.5" opacity="0.65" />
            <line x1="42" y1="37.5" x2="48" y2="37.5" opacity="0.65" />
            <line x1="42" y1="40.5" x2="48" y2="40.5" opacity="0.65" />
            <line x1="42" y1="43.5" x2="46" y2="43.5" opacity="0.65" />
          </>
        ) : null}
        {role === "workflow" ? (
          <>
            <path d="M40 35 L50 35 M47.5 33 L50 35 L47.5 37" opacity="0.65" />
            <path d="M50 45 L40 45 M42.5 43 L40 45 L42.5 47" opacity="0.65" />
          </>
        ) : null}
        {role === "devops" ? (
          <>
            <rect x="38" y="33" width="14" height="4" rx="0.75" opacity="0.65" />
            <rect x="38" y="39" width="14" height="4" rx="0.75" opacity="0.65" />
            <rect x="38" y="45" width="14" height="4" rx="0.75" opacity="0.65" />
            <circle cx="49.5" cy="35" r="1" fill="currentColor" stroke="none" opacity="0.6" />
            <circle cx="49.5" cy="41" r="1" fill="currentColor" stroke="none" opacity="0.6" />
            <circle cx="49.5" cy="47" r="1" fill="currentColor" stroke="none" opacity="0.6" />
          </>
        ) : null}
      </svg>
    </span>
  );
}

interface SpecialistBadgeProps {
  role: SpecialistRole;
  detail?: ReactNode;
}

export function SpecialistBadge({ role, detail }: SpecialistBadgeProps) {
  const meta = SPECIALIST_META[role];

  return (
    <div className={`inline-flex items-center gap-3 rounded-[999px] border px-3 py-2 ${meta.panel}`}>
      <SpecialistCrab role={role} size="sm" />
      <div className="min-w-0">
        <p className={`text-sm font-medium ${meta.tint}`}>{meta.label}</p>
        <p className="text-[11px] text-[var(--muted-foreground)]">{detail ?? meta.subtitle}</p>
      </div>
    </div>
  );
}
