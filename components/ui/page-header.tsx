interface PageHeaderProps {
  title: string;
  description: string;
  eyebrow?: string;
  badge?: string;
}

export function PageHeader({
  title,
  description,
  eyebrow = "Authrix Control Tower",
  badge = "Phase 9B",
}: PageHeaderProps) {
  return (
    <header className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-[linear-gradient(135deg,rgba(15,23,42,0.9),rgba(8,12,24,0.76))] px-6 py-6 shadow-[0_24px_70px_rgba(2,6,23,0.32)] backdrop-blur-xl md:px-8 md:py-7">
      <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-[radial-gradient(circle_at_center,rgba(103,232,249,0.14),transparent_72%)]" />
      <div className="relative space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-cyan-200/75">
            {eyebrow}
          </p>
          {badge ? (
            <span className="rounded-full border border-cyan-300/20 bg-cyan-300/8 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-cyan-100/70">
              {badge}
            </span>
          ) : null}
        </div>
        <h1 className="text-3xl font-semibold tracking-tight text-zinc-50 md:text-[2.15rem]">
          {title}
        </h1>
        <p className="max-w-3xl text-sm leading-7 text-slate-300/90">
          {description}
        </p>
      </div>
    </header>
  );
}
