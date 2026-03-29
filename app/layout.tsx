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
      <body className="bg-zinc-950 text-zinc-100 antialiased">
        <div className="flex min-h-screen flex-col md:flex-row">
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
          <main className="flex-1 p-5 md:p-8">{children}</main>
        </div>
      </body>
    </html>
  );
}
