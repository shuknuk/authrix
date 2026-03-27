import { cn } from "@/lib/utils";

export function StatusBadge({
  tone,
  children,
}: {
  tone: "accent" | "success" | "warning" | "danger" | "neutral";
  children: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold",
        tone === "accent" && "bg-accent-soft text-accent",
        tone === "success" && "bg-[rgba(31,122,90,0.12)] text-success",
        tone === "warning" && "bg-[rgba(183,121,31,0.12)] text-warning",
        tone === "danger" && "bg-[rgba(165,63,63,0.12)] text-danger",
        tone === "neutral" && "bg-[rgba(17,33,50,0.06)] text-foreground",
      )}
    >
      {children}
    </span>
  );
}
