import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { ApprovalModalProvider } from "@/components/ui/approval-modal-provider";
import { AppShell } from "@/components/layout/app-shell";
import { getOptionalSession, requireSession } from "@/lib/auth/session";
import { isAuthConfigured } from "@/lib/auth/auth0";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  // If Auth0 is not configured, allow access anyway (demo mode)
  if (!isAuthConfigured) {
    return (
      <ApprovalModalProvider actorName="Demo User">
        <AppShell user={null}>{children}</AppShell>
      </ApprovalModalProvider>
    );
  }

  const session = await requireSession("/");

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <ApprovalModalProvider
      actorName={session.user?.name ?? session.user?.nickname ?? "Authrix user"}
    >
      <AppShell user={session.user}>{children}</AppShell>
    </ApprovalModalProvider>
  );
}
