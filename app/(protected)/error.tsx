"use client";

export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center p-8">
      <div className="authrix-card max-w-2xl rounded-[2rem] p-8">
        <p className="authrix-kicker text-danger">Route error</p>
        <h2 className="authrix-display mt-4 text-4xl font-medium">
          The dashboard hit an unexpected edge.
        </h2>
        <p className="mt-4 text-sm leading-7 text-muted">
          {error.message ||
            "Authrix could not finish loading this page. Try the route again."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background"
        >
          Retry page
        </button>
      </div>
    </main>
  );
}
