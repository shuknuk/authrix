export default function ProtectedLoading() {
  return (
    <main className="authrix-grid flex min-h-screen items-center justify-center p-6">
      <div className="authrix-card w-full max-w-5xl rounded-[2rem] p-8">
        <div className="grid gap-6 md:grid-cols-[220px_1fr]">
          <div className="space-y-3">
            <div className="h-6 w-28 animate-pulse rounded-full bg-accent-soft" />
            <div className="h-12 w-full animate-pulse rounded-2xl bg-[rgba(17,33,50,0.08)]" />
            <div className="h-12 w-full animate-pulse rounded-2xl bg-[rgba(17,33,50,0.08)]" />
            <div className="h-12 w-full animate-pulse rounded-2xl bg-[rgba(17,33,50,0.08)]" />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="h-64 animate-pulse rounded-[1.5rem] bg-[rgba(17,33,50,0.08)]" />
            <div className="h-64 animate-pulse rounded-[1.5rem] bg-[rgba(17,33,50,0.08)]" />
            <div className="h-64 animate-pulse rounded-[1.5rem] bg-[rgba(17,33,50,0.08)]" />
            <div className="h-64 animate-pulse rounded-[1.5rem] bg-[rgba(17,33,50,0.08)]" />
          </div>
        </div>
      </div>
    </main>
  );
}
