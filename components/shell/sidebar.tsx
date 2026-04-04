"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AuthrixLogo } from "@/components/brand/authrix-logo";
import { DesertCrab } from "@/components/brand/desert-crab";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: GridIcon },
  { href: "/connections", label: "Connections", icon: ConnectionsIcon },
  { href: "/activity", label: "Activity", icon: ActivityIcon },
  { href: "/tasks", label: "Tasks", icon: TasksIcon },
  { href: "/costs", label: "Costs", icon: CostsIcon },
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
    <aside className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center border-t border-[var(--border)] bg-[var(--card)]/95 backdrop-blur-xl md:static md:h-screen md:w-[260px] md:flex-col md:border-r md:border-t-0">
      <div className="flex w-full items-center justify-between px-4 md:h-full md:flex-col md:items-stretch md:py-6 md:px-5">
        {/* Logo */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 text-[var(--foreground)] md:mb-8"
        >
          <div className="relative">
            <AuthrixLogo className="h-5 w-5" />
            {/* Small crab mascot */}
            <div className="absolute -right-1 -top-1" aria-hidden="true">
              <DesertCrab size="xs" variant="ghost" className="opacity-70" />
            </div>
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold">Authrix</p>
            <p className="text-[11px] text-[var(--foreground-muted)]">Governed operations</p>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="flex items-center gap-1 overflow-x-auto md:flex-col md:gap-1">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(item.href + "/");
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  "flex min-w-fit items-center gap-2 rounded-lg px-3 py-2 text-sm transition-all md:w-full md:px-3 md:py-2.5",
                  isActive
                    ? "bg-[var(--primary)]/10 text-[var(--primary)] font-medium"
                    : "text-[var(--foreground-muted)] hover:bg-[var(--background-muted)] hover:text-[var(--foreground)]",
                ].join(" ")}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Section */}
        <div className="hidden md:mt-auto md:block">
          {user ? (
            <div className="space-y-3">
              <div className="rounded-xl border border-[var(--border)] bg-[var(--background-elevated)] p-3">
                <p className="text-sm font-medium text-[var(--foreground)]">
                  {user.name ?? "Authenticated user"}
                </p>
                <p className="mt-0.5 break-all text-xs text-[var(--foreground-muted)]">
                  {user.email}
                </p>
              </div>

              <a
                href="/auth/logout"
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-[var(--border)] px-3 py-2 text-sm text-[var(--foreground-muted)] transition-colors hover:bg-[var(--background-muted)] hover:text-[var(--foreground)]"
              >
                <LogoutIcon className="h-4 w-4" />
                Sign out
              </a>
            </div>
          ) : (
            <p className="text-xs text-[var(--foreground-muted)]">
              Sign in to access workspace pages.
            </p>
          )}
        </div>
      </div>
    </aside>
  );
}

// Icon Components
function GridIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
      />
    </svg>
  );
}

function ConnectionsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
      />
    </svg>
  );
}

function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function TasksIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    </svg>
  );
}

function CostsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function LogoutIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
      />
    </svg>
  );
}
