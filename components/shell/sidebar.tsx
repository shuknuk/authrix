"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/connections", label: "Connections" },
  { href: "/activity", label: "Activity" },
  { href: "/tasks", label: "Tasks" },
  { href: "/costs", label: "Finance" },
];

interface SidebarProps {
  user: {
    name?: string;
    email?: string;
  } | null;
}

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="border-b border-white/10 bg-[linear-gradient(180deg,rgba(8,12,24,0.96),rgba(9,15,28,0.92))] p-5 backdrop-blur-xl md:w-72 md:border-b-0 md:border-r md:p-6">
      <div className="flex items-start justify-between gap-6 md:flex-col md:gap-8">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-3 py-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-cyan-300 via-teal-300 to-emerald-300 text-xs font-semibold text-slate-950">
              AX
            </span>
            <div>
              <h1 className="text-lg font-semibold tracking-tight text-zinc-50">Authrix</h1>
              <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                Startup operations
              </p>
            </div>
          </div>

          <div className="rounded-[1.4rem] border border-white/10 bg-white/5 p-4">
            <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
              Control posture
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Live oversight for engineering, docs, workflow, finance, and approvals.
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-[11px] uppercase tracking-[0.16em]">
              <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-2.5 py-1 text-cyan-100/80">
                Runtime aware
              </span>
              <span className="rounded-full border border-emerald-300/20 bg-emerald-300/10 px-2.5 py-1 text-emerald-100/80">
                Approval gated
              </span>
            </div>
          </div>
        </div>
        <div className="text-right text-xs text-zinc-600 md:mt-auto md:w-full md:text-left">
          {user ? (
            <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                Operator
              </div>
              <div className="mt-2 font-medium text-zinc-200">
                {user.name ?? "Authenticated User"}
              </div>
              <div className="mt-1 break-all text-slate-500">{user.email}</div>
            </div>
          ) : (
            <div className="rounded-[1.25rem] border border-white/10 bg-white/5 p-4 text-left text-slate-400">
              <div className="text-[11px] uppercase tracking-[0.22em] text-slate-500">
                Build
              </div>
              <div className="mt-2 font-medium text-zinc-200">v0.1.0-alpha</div>
            </div>
          )}
        </div>
      </div>

      {user ? (
        <>
          <nav className="mt-5 flex gap-2 overflow-x-auto pb-1 md:mt-8 md:flex-col md:gap-2 md:overflow-visible md:pb-0">
            {navItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group rounded-full border px-3 py-2.5 text-sm transition-all md:rounded-2xl ${
                    isActive
                      ? "border-cyan-300/25 bg-cyan-300/10 text-white shadow-[0_0_0_1px_rgba(103,232,249,0.08)]"
                      : "border-white/5 bg-white/0 text-slate-400 hover:border-white/10 hover:bg-white/5 hover:text-zinc-200"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium">{item.label}</span>
                    <span
                      className={`text-[10px] uppercase tracking-[0.22em] ${
                        isActive ? "text-cyan-100/75" : "text-slate-600 group-hover:text-slate-500"
                      }`}
                    >
                      {item.href.replace("/", "") || "root"}
                    </span>
                  </div>
                </Link>
              );
            })}
          </nav>

          <div className="mt-5 md:mt-8">
            <a
              href="/auth/logout"
              className="inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 transition hover:border-white/20 hover:bg-white/8 hover:text-white"
            >
              Sign out
            </a>
          </div>
        </>
      ) : (
        <div className="mt-5 rounded-[1.35rem] border border-white/10 bg-white/5 p-4 text-sm text-slate-400 md:mt-8">
          Sign in to access the Authrix control tower.
        </div>
      )}
    </aside>
  );
}
