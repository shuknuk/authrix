import type { ReactNode } from "react";

export function CardFrame({
  eyebrow,
  title,
  description,
  status = "ready",
  emptyMessage,
  errorMessage,
  footer,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  status?: "ready" | "loading" | "empty" | "error";
  emptyMessage?: string;
  errorMessage?: string;
  footer?: ReactNode;
  children?: ReactNode;
}) {
  return (
    <section className="authrix-card flex h-full flex-col rounded-[1.6rem] p-6">
      <div>
        <p className="authrix-kicker text-accent">{eyebrow}</p>
        <h2 className="mt-3 text-2xl font-semibold text-foreground">{title}</h2>
        <p className="mt-2 text-sm leading-7 text-muted">{description}</p>
      </div>

      <div className="mt-5 flex-1">
        {status === "loading" ? (
          <div className="space-y-3">
            <div className="h-5 w-3/4 animate-pulse rounded-full bg-accent-soft" />
            <div className="h-20 animate-pulse rounded-3xl bg-[rgba(17,33,50,0.06)]" />
            <div className="h-16 animate-pulse rounded-3xl bg-[rgba(17,33,50,0.06)]" />
          </div>
        ) : null}
        {status === "empty" ? (
          <div className="flex h-full items-center justify-center rounded-[1.25rem] border border-dashed border-line bg-[rgba(17,33,50,0.03)] px-4 py-8 text-center text-sm leading-7 text-muted">
            {emptyMessage ?? "No data available yet."}
          </div>
        ) : null}
        {status === "error" ? (
          <div className="flex h-full items-center justify-center rounded-[1.25rem] border border-dashed border-danger bg-[rgba(165,63,63,0.06)] px-4 py-8 text-center text-sm leading-7 text-danger">
            {errorMessage ?? "This panel could not be loaded."}
          </div>
        ) : null}
        {status === "ready" ? children : null}
      </div>

      {footer ? <div className="mt-5">{footer}</div> : null}
    </section>
  );
}
