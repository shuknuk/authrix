interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/60 px-4 py-6 text-center">
      <p className="text-sm font-medium text-zinc-200">{title}</p>
      <p className="mt-2 text-xs leading-5 text-zinc-500">{description}</p>
    </div>
  );
}
