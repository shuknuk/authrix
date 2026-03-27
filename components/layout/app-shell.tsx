import type { ReactNode } from "react";
import { RefreshButton } from "@/components/ui/refresh-button";
import { SidebarNav } from "@/components/layout/sidebar-nav";

export function AppShell({
  user,
  children,
}: {
  user: {
    name?: string | null;
    email?: string | null;
    nickname?: string | null;
  };
  children: ReactNode;
}) {
  const displayName = user.name ?? user.nickname ?? "Authenticated user";
  const initials = displayName
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <main className="authrix-grid min-h-screen p-4 md:p-6">
      <div className="authrix-shell mx-auto grid min-h-[calc(100vh-2rem)] w-full max-w-7xl gap-6 rounded-[2rem] border border-white/50 p-4 md:grid-cols-[240px_1fr] md:p-6">
        <aside className="authrix-card-soft rounded-[1.75rem] p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="authrix-kicker text-accent">Authrix</p>
              <h2 className="authrix-display mt-2 text-3xl font-medium">Ops shell</h2>
            </div>
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-foreground text-sm font-semibold text-background">
              {initials}
            </div>
          </div>
          <p className="mt-4 text-sm leading-7 text-muted">
            Secure agent workspace for weekly engineering review and approval-gated execution.
          </p>
          <div className="authrix-divider my-5 border-t" />
          <SidebarNav />
          <div className="authrix-divider my-5 border-t" />
          <div className="space-y-2 text-sm">
            <p className="font-semibold text-foreground">{displayName}</p>
            <p className="text-muted">{user.email ?? "Signed in via Auth0"}</p>
            <a
              href="/auth/logout"
              className="inline-flex rounded-full border border-line px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent-soft"
            >
              Log out
            </a>
          </div>
        </aside>

        <section className="flex flex-col gap-6">
          <div className="authrix-card-soft flex flex-col justify-between gap-4 rounded-[1.75rem] px-5 py-4 md:flex-row md:items-center">
            <div>
              <p className="authrix-kicker text-accent">Weekly operating view</p>
              <p className="mt-2 text-sm text-muted">
                The dashboard combines GitHub activity, narrow agent outputs, and approval state.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <RefreshButton />
            </div>
          </div>
          <div>{children}</div>
        </section>
      </div>
    </main>
  );
}
