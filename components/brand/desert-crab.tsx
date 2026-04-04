"use client";

import { cn } from "@/lib/utils";

export interface DesertCrabProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
  variant?: "default" | "ghost" | "outline" | "filled";
  animate?: boolean;
}

const sizeMap = {
  xs: { container: "h-5 w-5", svg: "h-3 w-3" },
  sm: { container: "h-8 w-8", svg: "h-4 w-4" },
  md: { container: "h-10 w-10", svg: "h-5 w-5" },
  lg: { container: "h-12 w-12", svg: "h-6 w-6" },
  xl: { container: "h-16 w-16", svg: "h-8 w-8" },
};

const variantMap = {
  default: "text-[var(--primary)]",
  ghost: "text-[var(--foreground-muted)] opacity-50",
  outline: "border border-[var(--border)] text-[var(--foreground-soft)] rounded-lg",
  filled: "bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg",
};

export function DesertCrab({
  size = "md",
  className,
  variant = "default",
  animate = false,
}: DesertCrabProps) {
  const sizeClasses = sizeMap[size];
  const variantClasses = variantMap[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center",
        sizeClasses.container,
        variantClasses,
        animate && "animate-pulse",
        className
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 90 68"
        className={sizeClasses.svg}
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        {/* Body */}
        <ellipse cx="45" cy="40" rx="22" ry="16" />
        {/* Eyes */}
        <path d="M37 24 L45 17 L53 24" />
        <line x1="37" y1="25" x2="31" y2="18" />
        <circle cx="29.5" cy="16.5" r="2.5" fill="currentColor" stroke="none" />
        <line x1="53" y1="25" x2="59" y2="18" />
        <circle cx="60.5" cy="16.5" r="2.5" fill="currentColor" stroke="none" />
        {/* Left claws */}
        <line x1="23" y1="33" x2="11" y2="26" />
        <line x1="11" y1="26" x2="5" y2="22" />
        <line x1="11" y1="26" x2="8" y2="30" />
        {/* Right claws */}
        <line x1="67" y1="33" x2="79" y2="26" />
        <line x1="79" y1="26" x2="85" y2="22" />
        <line x1="79" y1="26" x2="82" y2="30" />
        {/* Left legs */}
        <line x1="24" y1="37" x2="8" y2="36" />
        <line x1="23" y1="42" x2="7" y2="44" />
        <line x1="24" y1="47" x2="10" y2="53" />
        {/* Right legs */}
        <line x1="66" y1="37" x2="82" y2="36" />
        <line x1="67" y1="42" x2="83" y2="44" />
        <line x1="66" y1="47" x2="80" y2="53" />
      </svg>
    </span>
  );
}

// Animated walking crab for decorative purposes
export function WalkingCrab({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-block", className)}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 90 68"
        className="h-6 w-6 text-[var(--primary)]"
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
      </svg>
    </span>
  );
}

// Sad crab for empty states
export function SadCrab({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex h-16 w-16 items-center justify-center rounded-full bg-[var(--background-muted)]",
        className
      )}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 90 68"
        className="h-8 w-8 text-[var(--foreground-muted)]"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <ellipse cx="45" cy="40" rx="22" ry="16" />
        {/* Droopy eyes for sad crab */}
        <path d="M37 24 L45 17 L53 24" />
        <line x1="37" y1="25" x2="31" y2="20" />
        <circle cx="29.5" cy="18.5" r="2.5" fill="currentColor" stroke="none" />
        <line x1="53" y1="25" x2="59" y2="20" />
        <circle cx="60.5" cy="18.5" r="2.5" fill="currentColor" stroke="none" />
        {/* Sad mouth */}
        <path d="M40 50 Q45 47 50 50" />
        {/* Legs drooping */}
        <line x1="23" y1="33" x2="11" y2="28" />
        <line x1="11" y1="28" x2="5" y2="24" />
        <line x1="67" y1="33" x2="79" y2="28" />
        <line x1="79" y1="28" x2="85" y2="24" />
        <line x1="24" y1="37" x2="8" y2="38" />
        <line x1="23" y1="42" x2="7" y2="46" />
        <line x1="24" y1="47" x2="10" y2="55" />
        <line x1="66" y1="37" x2="82" y2="38" />
        <line x1="67" y1="42" x2="83" y2="46" />
        <line x1="66" y1="47" x2="80" y2="55" />
      </svg>
    </span>
  );
}

// Peeking crab - shows just the top half
export function PeekingCrab({ className }: { className?: string }) {
  return (
    <span
      className={cn("inline-block overflow-hidden", className)}
      aria-hidden="true"
      style={{ height: "1.5rem" }}
    >
      <svg
        viewBox="0 0 90 40"
        className="h-8 w-8 text-[var(--primary)]"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      >
        <ellipse cx="45" cy="35" rx="22" ry="16" />
        <path d="M37 19 L45 12 L53 19" />
        <line x1="37" y1="20" x2="31" y2="13" />
        <circle cx="29.5" cy="11.5" r="2.5" fill="currentColor" stroke="none" />
        <line x1="53" y1="20" x2="59" y2="13" />
        <circle cx="60.5" cy="11.5" r="2.5" fill="currentColor" stroke="none" />
        <line x1="23" y1="28" x2="11" y2="21" />
        <line x1="11" y1="21" x2="5" y2="17" />
        <line x1="67" y1="28" x2="79" y2="21" />
        <line x1="79" y1="21" x2="85" y2="17" />
      </svg>
    </span>
  );
}

// Mini crab icon for inline use
export function MiniCrab({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 90 68"
      className={cn("h-3 w-3 text-[var(--primary)]", className)}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      aria-hidden="true"
    >
      <ellipse cx="45" cy="40" rx="22" ry="16" />
      <path d="M37 24 L45 17 L53 24" />
      <circle cx="29.5" cy="16.5" r="2.5" fill="currentColor" stroke="none" />
      <circle cx="60.5" cy="16.5" r="2.5" fill="currentColor" stroke="none" />
      <line x1="23" y1="33" x2="8" y2="30" />
      <line x1="67" y1="33" x2="82" y2="30" />
    </svg>
  );
}
