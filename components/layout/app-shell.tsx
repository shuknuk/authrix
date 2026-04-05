import type { ReactNode } from "react";
import { RefreshButton } from "@/components/ui/refresh-button";
import { Sidebar } from "@/components/shell/sidebar";

interface AppShellProps {
  user: {
    name?: string | null;
    email?: string | null;
    nickname?: string | null;
  } | null;
  children: ReactNode;
}

export function AppShell({ user, children }: AppShellProps) {
  // Convert user to match Sidebar expected type
  const sidebarUser = user
    ? {
        name: user.name ?? undefined,
        email: user.email ?? undefined,
      }
    : null;

  return (
    <div className="flex min-h-screen bg-[var(--background)]">
      <Sidebar user={sidebarUser} />
      <main className="flex-1 pb-20 md:pb-0 md:pl-[260px]">
        <div className="mx-auto max-w-7xl p-4 md:p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-[var(--foreground)]">
                Dashboard
              </h1>
              <p className="text-sm text-[var(--foreground-muted)]">
                Secure agent workspace for weekly engineering review and approval-gated execution.
              </p>
            </div>
            <RefreshButton />
          </div>
          {children}
        </div>
      </main>
    </div>
  );
}
