import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { ApprovalModalProvider } from "@/components/ui/approval-modal-provider";
import { AppShell } from "@/components/layout/app-shell";
import { SetupBanner } from "@/components/ui/setup-banner";
import { getSession } from "@/lib/auth/client";
import { isAuth0Configured } from "@/lib/auth/config";

export const dynamic = "force-dynamic";

export default async function ProtectedLayout({
  children,
}: {
  children: ReactNode;
}) {
  if (!isAuth0Configured()) {
    return (
      <main className="flex min-h-screen items-center justify-center p-8">
        <div className="w-full max-w-3xl">
          <SetupBanner
            title="Protected routes need Auth0 configuration"
            description="Authrix uses real Auth0 protection for dashboard pages. Configure the environment variables in .env.local, then reload the app."
            items={[
              "AUTH0_DOMAIN",
              "AUTH0_CLIENT_ID",
              "AUTH0_CLIENT_SECRET",
              "AUTH0_SECRET",
              "APP_BASE_URL",
            ]}
          />
        </div>
      </main>
    );
  }

  const session = await getSession();

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <ApprovalModalProvider
      actorName={session.user.name ?? session.user.nickname ?? "Authrix user"}
    >
      <AppShell user={session.user}>{children}</AppShell>
    </ApprovalModalProvider>
  );
}
