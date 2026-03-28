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
    <aside className="w-56 border-r border-zinc-800 bg-zinc-900 p-6 flex flex-col gap-8">
      <div>
        <h1 className="text-xl font-bold tracking-tight">Authrix</h1>
        <p className="text-xs text-zinc-500 mt-1">Operations Platform</p>
      </div>
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`px-3 py-2 rounded text-sm transition-colors ${
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
      <div className="mt-auto text-xs text-zinc-600">v0.1.0-alpha</div>
    </aside>
  );
}
