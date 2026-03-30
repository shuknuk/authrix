import type { ReactNode } from "react";

interface CardShellProps {
  title: string;
  description?: string;
  badge?: ReactNode;
  children: ReactNode;
}

export function CardShell({
  title,
  description,
  badge,
  children,
}: CardShellProps) {
  return (
    <section className="relative overflow-hidden rounded-[1.6rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.82),rgba(7,11,20,0.92))] p-6 shadow-[0_24px_70px_rgba(2,6,23,0.38)] backdrop-blur-xl">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
      <div className="pointer-events-none absolute right-0 top-0 h-32 w-32 rounded-full bg-cyan-300/8 blur-3xl" />
      <div className="mb-5 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-[0.02em] text-zinc-50">{title}</h3>
          {description ? (
            <p className="mt-1 max-w-2xl text-xs leading-5 text-slate-400">{description}</p>
          ) : null}
        </div>
        {badge}
      </div>
      <div className="relative">{children}</div>
    </section>
  );
}
