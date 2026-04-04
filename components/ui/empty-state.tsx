import { SadCrab, DesertCrab } from "@/components/brand/desert-crab";

interface EmptyStateProps {
  title: string;
  description: string;
  mascot?: "sad" | "crab" | "none";
}

export function EmptyState({ title, description, mascot = "sad" }: EmptyStateProps) {
  return (
    <div className="rounded-xl border border-dashed border-[var(--border)] bg-[var(--background-muted)] px-6 py-8 text-center">
      <div className="mx-auto mb-4">
        {mascot === "sad" && <SadCrab />}
        {mascot === "crab" && (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--background-elevated)]">
            <DesertCrab size="sm" />
          </div>
        )}
        {mascot === "none" && (
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--background-elevated)]">
            <svg
              className="h-5 w-5 text-[var(--foreground-muted)]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
              />
            </svg>
          </div>
        )}
      </div>
      <p className="text-sm font-medium text-[var(--foreground)]">{title}</p>
      <p className="mx-auto mt-1 max-w-xs text-sm text-[var(--foreground-muted)]">
        {description}
      </p>
    </div>
  );
}
