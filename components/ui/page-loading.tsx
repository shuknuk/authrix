export function PageLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="h-3 w-36 rounded-full bg-zinc-800" />
        <div className="h-10 w-64 rounded-full bg-zinc-900" />
        <div className="h-4 w-full max-w-2xl rounded-full bg-zinc-900" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6"
          >
            <div className="mb-4 h-4 w-32 rounded-full bg-zinc-800" />
            <div className="space-y-3">
              <div className="h-4 w-full rounded-full bg-zinc-900" />
              <div className="h-4 w-5/6 rounded-full bg-zinc-900" />
              <div className="h-4 w-2/3 rounded-full bg-zinc-900" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
