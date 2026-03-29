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
    <section className="rounded-2xl border border-zinc-800 bg-zinc-900/80 p-6 shadow-[0_18px_40px_rgba(0,0,0,0.22)]">
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-zinc-100">{title}</h3>
          {description ? (
            <p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p>
          ) : null}
        </div>
        {badge}
      </div>
      {children}
    </section>
  );
}
