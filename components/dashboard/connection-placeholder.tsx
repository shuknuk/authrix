import { Button } from "@/components/ui/button";
import { CardShell } from "@/components/ui/card-shell";
import Link from "next/link";
import type { ReactNode } from "react";

interface ConnectionPlaceholderProps {
  service: string;
  description: string;
  href: string;
  icon: ReactNode;
  actionLabel?: string;
  tone?: "default" | "accent" | "warning";
}

export function ConnectionPlaceholder({
  service,
  description,
  href,
  icon,
  actionLabel = "Connect",
  tone = "default",
}: ConnectionPlaceholderProps) {
  return (
    <CardShell
      title={`${service} Connection`}
      description={description}
      tone={tone}
    >
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-dashed border-[var(--border-muted)] text-[var(--foreground-muted)]">
          {icon}
        </div>
        <div className="space-y-1">
          <p className="text-sm font-medium text-[var(--foreground)]">
            {service} is not connected
          </p>
          <p className="text-xs text-[var(--foreground-muted)]">
            Connect to see live data and enable automated insights
          </p>
        </div>
        <Button variant="secondary" onClick={() => window.location.href = href}>
          {actionLabel}
        </Button>
      </div>
    </CardShell>
  );
}

interface IntegrationStatusIndicatorProps {
  services: {
    name: string;
    connected: boolean;
    live?: boolean;
    href: string;
  }[];
}

export function IntegrationStatusIndicator({ services }: IntegrationStatusIndicatorProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      {services.map((service) => (
        <Link
          key={service.name}
          href={service.href}
          className={`group flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors hover:bg-[var(--background-elevated)] ${
            service.connected
              ? service.live
                ? "border-[var(--success-border)] bg-[var(--success-soft)] text-[var(--success)]"
                : "border-[var(--warning-border)] bg-[var(--warning-soft)] text-[var(--clay)]"
              : "border-[var(--border)] bg-[var(--card)] text-[var(--foreground-muted)]"
          }`}
          title={
            service.connected
              ? service.live
                ? `${service.name}: Live data`
                : `${service.name}: Connected (mock data)`
              : `${service.name}: Not connected`
          }
        >
          <span
            className={`h-2 w-2 rounded-full ${
              service.connected
                ? service.live
                  ? "bg-[var(--success)]"
                  : "bg-[var(--clay)]"
                : "bg-[var(--foreground-muted)]"
            }`}
          />
          <span className="font-medium">{service.name}</span>
          {service.connected && service.live && (
            <span className="text-xs opacity-70">● live</span>
          )}
          {service.connected && !service.live && (
            <span className="text-xs opacity-70">○ mock</span>
          )}
        </Link>
      ))}
    </div>
  );
}
