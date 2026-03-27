"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/connections", label: "Connections" },
  { href: "/activity", label: "Activity" },
  { href: "/tasks", label: "Tasks" },
  { href: "/costs", label: "Costs" },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <nav className="space-y-2">
      {navItems.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition-colors",
              active
                ? "bg-foreground text-background"
                : "text-foreground hover:bg-accent-soft",
            )}
          >
            <span>{item.label}</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.18em]">
              0{navItems.indexOf(item) + 1}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
