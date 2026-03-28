"use client";

interface GlobalErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-xl rounded-2xl border border-red-900/30 bg-zinc-900/80 p-8 text-center shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-red-400">
          Control Tower Error
        </p>
        <h2 className="mt-3 text-2xl font-semibold text-zinc-50">
          The workspace failed to load
        </h2>
        <p className="mt-3 text-sm leading-6 text-zinc-400">
          {error.message ||
            "Authrix hit an unexpected error while loading the current view."}
        </p>
        <button
          type="button"
          onClick={reset}
          className="mt-6 rounded-full bg-zinc-100 px-5 py-2 text-sm font-medium text-zinc-950 transition hover:bg-white"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
