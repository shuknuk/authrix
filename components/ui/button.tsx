"use client";

import { type ReactNode } from "react";

interface ButtonProps {
  children: ReactNode;
  variant?: "primary" | "ghost" | "secondary";
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
}

export function Button({
  children,
  variant = "primary",
  onClick,
  disabled = false,
  type = "button",
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors";

  const variantClasses = {
    primary:
      "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--bronze-soft)]",
    ghost:
      "bg-transparent text-[var(--foreground-muted)] hover:bg-[var(--background-muted)] hover:text-[var(--foreground)]",
    secondary:
      "bg-[var(--background-muted)] text-[var(--foreground)] hover:bg-[var(--background-sand)]",
  };

  const disabledClasses = disabled
    ? "opacity-50 cursor-not-allowed"
    : "cursor-pointer";

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${disabledClasses}`}
    >
      {children}
    </button>
  );
}
