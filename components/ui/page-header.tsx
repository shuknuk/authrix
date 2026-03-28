interface PageHeaderProps {
  title: string;
  description: string;
}

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-[0.24em] text-zinc-500">
        Authrix Control Tower
      </p>
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
          {title}
        </h1>
        <p className="max-w-3xl text-sm leading-6 text-zinc-400">
          {description}
        </p>
      </div>
    </header>
  );
}
