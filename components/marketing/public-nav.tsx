"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { AuthrixLogo } from "@/components/brand/authrix-logo";

const NAV_LINKS = [
  { label: "Product", href: "#product" },
  { label: "Solutions", href: "#solutions" },
  { label: "Pricing", href: "#pricing" },
];

function scrollToAnchor(href: string) {
  const target = document.querySelector(href);
  if (!target) return;

  const offset = 80;
  const top = target.getBoundingClientRect().top + window.scrollY - offset;
  window.scrollTo({ top, behavior: "smooth" });
}

interface PublicNavProps {
  authReady?: boolean;
}

export function PublicNav({ authReady = false }: PublicNavProps) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isScrolled = scrolled;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-[var(--card)]/95 backdrop-blur-xl border-b border-[var(--border)]"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 md:px-8">
        {/* Logo */}
        <Link
          href="/"
          className={`flex items-center gap-2.5 transition-colors ${
            isScrolled ? "text-[var(--foreground)]" : "text-white"
          }`}
        >
          <AuthrixLogo
            className="h-5 w-5"
            variant={isScrolled ? "default" : "light"}
          />
          <span className="text-sm font-semibold tracking-tight">Authrix</span>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((link) => (
            <a
              key={link.label}
              href={link.href}
              onClick={(e) => {
                e.preventDefault();
                scrollToAnchor(link.href);
              }}
              className={`text-sm font-medium transition-colors ${
                isScrolled
                  ? "text-[var(--foreground-soft)] hover:text-[var(--foreground)]"
                  : "text-white/80 hover:text-white"
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {authReady && (
            <a
              href="/auth/login?returnTo=/dashboard"
              className={`hidden text-sm font-medium transition-colors md:block ${
                isScrolled
                  ? "text-[var(--foreground-soft)] hover:text-[var(--foreground)]"
                  : "text-white/80 hover:text-white"
              }`}
            >
              Sign in
            </a>
          )}
          <a
            href="#cta"
            onClick={(e) => {
              e.preventDefault();
              scrollToAnchor("#cta");
            }}
            className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-medium transition-all ${
              isScrolled
                ? "bg-[var(--primary)] text-[var(--primary-foreground)] hover:bg-[var(--bronze)]"
                : "bg-[var(--card)]/90 text-[var(--foreground)] hover:bg-[var(--card)]"
            }`}
          >
            Request Access
          </a>
        </div>
      </div>
    </header>
  );
}
