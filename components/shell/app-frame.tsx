"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/shell/sidebar";

interface AppFrameProps {
  children: ReactNode;
  user: {
    name?: string;
    email?: string;
  } | null;
}

export function AppFrame({ children, user }: AppFrameProps) {
  const pathname = usePathname();
  const isPublicHomepage = pathname === "/";

  // Public homepage doesn't use the authenticated shell
  if (isPublicHomepage) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen bg-[var(--cream)] md:flex">
      <Sidebar user={user} />
      <main className="flex-1 pb-24 pt-4 md:pb-8 md:pt-8">
        <div className="mx-auto max-w-6xl px-4 md:px-8">
          {children}
        </div>
      </main>
    </div>
  );
}
