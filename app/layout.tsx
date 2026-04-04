import type { Metadata } from "next";
import { Fraunces, JetBrains_Mono, Manrope } from "next/font/google";
import "./globals.css";
import { AppFrame } from "@/components/shell/app-frame";
import { getOptionalSession } from "@/lib/auth/session";

const ui = Manrope({
  subsets: ["latin"],
  variable: "--font-ui",
  weight: ["400", "500", "600", "700"],
});

const heading = Fraunces({
  subsets: ["latin"],
  variable: "--font-heading",
  weight: ["500", "600", "700"],
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-code",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Authrix",
  description: "Governed operations platform for engineering teams",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getOptionalSession();

  return (
    <html lang="en">
      <body className={`${ui.variable} ${heading.variable} ${mono.variable} antialiased`}>
        <AppFrame
          user={
            session
              ? {
                  name: session.user.name ?? session.user.nickname,
                  email: session.user.email,
                }
              : null
          }
        >
          {children}
        </AppFrame>
      </body>
    </html>
  );
}
