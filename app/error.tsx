"use client";

import { useEffect } from "react";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Redirect and not-found errors are handled by Next.js internally.
    // Log them at debug level only so they don't pollute the console.
    if (!error.digest?.startsWith("NEXT_")) {
      console.error("Workspace error:", error);
    }
  }, [error]);

  // Don't render the error UI for redirect or not-found errors.
  // Next.js handles these internally; showing our error boundary here
  // would be misleading since the user is about to be redirected.
  if (error.digest?.startsWith("NEXT_")) {
    return null;
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center px-5 py-10">
      <div className="w-full max-w-2xl rounded-[var(--radius-lg)] border border-[var(--danger-border)] bg-[var(--background-elevated)] p-8">
        <p className="authrix-outline-label text-[var(--danger)]">Workspace Error</p>
        <h2 className="mt-4 text-3xl leading-tight">The page could not load</h2>
        <p className="mt-3 text-sm leading-7 text-[var(--muted-foreground)]">
          {error.message ||
            "Authrix hit an unexpected error while loading this workspace view."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 inline-flex items-center rounded-full border border-[var(--primary-border)] bg-[var(--primary)] px-5 py-2 text-sm font-medium text-[var(--primary-foreground)] hover:opacity-90"
        >
          Retry view
        </button>
      </div>
    </div>
  );
}
