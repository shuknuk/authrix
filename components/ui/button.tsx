import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "solid" | "secondary" | "ghost" | "danger";
  children: ReactNode;
}

export function Button({
  variant = "solid",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-full px-4 py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed disabled:opacity-50",
        variant === "solid" && "bg-foreground text-background hover:-translate-y-0.5",
        variant === "secondary" &&
          "border border-line bg-surface text-foreground hover:bg-accent-soft",
        variant === "ghost" && "text-foreground hover:bg-accent-soft",
        variant === "danger" && "bg-danger text-white hover:brightness-110",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
