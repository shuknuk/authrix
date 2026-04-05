interface SetupBannerProps {
  title: string;
  description: string;
  items: string[];
}

export function SetupBanner({ title, description, items }: SetupBannerProps) {
  return (
    <section className="authrix-card rounded-[1.75rem] border border-dashed border-line p-6">
      <p className="authrix-kicker text-warning">Environment setup</p>
      <h2 className="mt-4 text-2xl font-semibold text-foreground">{title}</h2>
      <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">{description}</p>
      <div className="mt-5 flex flex-wrap gap-3">
        {items.map((item) => (
          <code
            key={item}
            className="rounded-full bg-[rgba(17,33,50,0.06)] px-3 py-2 text-xs font-semibold text-foreground"
          >
            {item}
          </code>
        ))}
      </div>
    </section>
  );
}
