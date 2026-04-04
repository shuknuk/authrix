export function PageLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="space-y-3 rounded-[24px] border border-[var(--border)] bg-[rgba(255,249,241,0.46)] px-5 py-6">
        <div className="h-3 w-32 rounded-full bg-[var(--background-muted)]" />
        <div className="h-11 w-72 rounded-full bg-[var(--sand)]" />
        <div className="h-4 w-full max-w-2xl rounded-full bg-[var(--background-muted)]" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="authrix-surface rounded-[var(--radius-md)] border p-5"
          >
            <div className="mb-4 h-4 w-40 rounded-full bg-[var(--background-muted)]" />
            <div className="space-y-2.5">
              <div className="h-3.5 w-full rounded-full bg-[var(--background-muted)]" />
              <div className="h-3.5 w-11/12 rounded-full bg-[var(--background-muted)]" />
              <div className="h-3.5 w-4/5 rounded-full bg-[var(--background-muted)]" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
