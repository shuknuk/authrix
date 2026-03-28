"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/connections", label: "Connections" },
  { href: "/activity", label: "Activity" },
  { href: "/tasks", label: "Tasks" },
  { href: "/costs", label: "Costs" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="border-b border-zinc-800 bg-zinc-900/95 p-5 md:w-56 md:border-b-0 md:border-r md:p-6">
      <div className="flex items-start justify-between gap-6 md:flex-col md:gap-8">
        <div>
          <h1 className="text-xl font-bold tracking-tight">Authrix</h1>
          <p className="mt-1 text-xs text-zinc-500">Operations Platform</p>
        </div>
        <div className="text-right text-xs text-zinc-600 md:mt-auto md:text-left">
          v0.1.0-alpha
        </div>
      </div>

      <nav className="mt-5 flex gap-2 overflow-x-auto pb-1 md:mt-8 md:flex-col md:gap-1 md:overflow-visible md:pb-0">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`rounded-full px-3 py-2 text-sm transition-colors md:rounded ${
                isActive
                  ? "bg-zinc-800 text-white font-medium"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
