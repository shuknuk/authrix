import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/shell/sidebar";
import { getOptionalSession } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Authrix",
  description: "Secure autonomous operations platform for startup teams",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getOptionalSession();

  return (
    <html lang="en" className="dark">
      <body className="antialiased">
        <div className="relative flex min-h-screen flex-col overflow-hidden md:flex-row">
          <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(103,232,249,0.14),transparent_60%)]" />
          <div className="pointer-events-none absolute right-0 top-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.12),transparent_68%)] blur-3xl" />
          <Sidebar
            user={
              session
                ? {
                    name: session.user.name ?? session.user.nickname,
                    email: session.user.email,
                  }
                : null
            }
          />
          <main className="relative flex-1 p-4 md:p-8">
            <div className="mx-auto max-w-[1500px]">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
