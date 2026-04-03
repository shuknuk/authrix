"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CardShell } from "@/components/ui/card-shell";
import type {
  RuntimeControlEvent,
  RuntimeStatus,
} from "@/types/runtime";

interface RuntimeControlCardProps {
  status: RuntimeStatus;
  events: RuntimeControlEvent[];
}

export function RuntimeControlCard({
  status,
  events,
}: RuntimeControlCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleReset(): void {
    setMessage(null);
    setError(null);

    startTransition(async () => {
      try {
        const response = await fetch("/api/runtime/control/reset", {
          method: "POST",
        });
        const payload = (await response.json().catch(() => ({}))) as {
          error?: string;
          event?: RuntimeControlEvent;
        };

        if (!response.ok) {
          throw new Error(payload.error ?? "Runtime adapter reset failed.");
        }

        setMessage(
          payload.event?.message ??
            "Authrix reset its runtime adapter successfully."
        );
        router.refresh();
      } catch (requestError) {
        setError(
          requestError instanceof Error
            ? requestError.message
            : "Runtime adapter reset failed."
        );
      }
    });
  }

  return (
    <CardShell
      title="Runtime Control"
      description="Use this to force a fresh Authrix runtime adapter connection and inspect recent reset attempts."
      badge={<StatusBadge mode={status.mode} />}
    >
      <div className="space-y-4">
        <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3">
          <p className="text-sm font-medium text-zinc-200">Adapter reset</p>
          <p className="mt-1 text-xs leading-5 text-zinc-500">
            This resets Authrix&apos;s runtime adapter and forces a fresh connection
            attempt. It does not reboot the external runtime host itself.
          </p>
          <button
            type="button"
            onClick={handleReset}
            disabled={isPending}
            className="mt-4 inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-100 transition hover:border-zinc-500 hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPending ? "Resetting adapter..." : "Reset runtime adapter"}
          </button>
          {message ? (
            <p className="mt-3 rounded-lg border border-green-900/40 bg-green-950/30 px-3 py-2 text-xs leading-5 text-green-200">
              {message}
            </p>
          ) : null}
          {error ? (
            <p className="mt-3 rounded-lg border border-red-900/40 bg-red-950/30 px-3 py-2 text-xs leading-5 text-red-200">
              {error}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          {events.length > 0 ? (
            events.slice(0, 5).map((event) => (
              <div
                key={event.id}
                className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-medium text-zinc-200">
                    {formatEventType(event.type)}
                  </p>
                  <EventBadge status={event.status} />
                </div>
                <p className="mt-1 text-xs leading-5 text-zinc-500">{event.message}</p>
                <p className="mt-2 text-[11px] text-zinc-600">
                  {new Date(event.createdAt).toLocaleString()}
                </p>
              </div>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 px-4 py-6">
              <p className="text-sm text-zinc-200">No runtime reset attempts yet.</p>
              <p className="mt-2 text-xs leading-5 text-zinc-500">
                Reset events will appear here once Authrix reconnect attempts are
                made from the control tower.
              </p>
            </div>
          )}
        </div>
      </div>
    </CardShell>
  );
}

function StatusBadge({ mode }: { mode: RuntimeStatus["mode"] }) {
  const className =
    mode === "live"
      ? "bg-green-900/30 text-green-300"
      : mode === "mock"
        ? "bg-zinc-800 text-zinc-400"
        : "bg-amber-900/30 text-amber-300";

  return <span className={`rounded-full px-2.5 py-1 text-xs ${className}`}>{mode}</span>;
}

function EventBadge({
  status,
}: {
  status: RuntimeControlEvent["status"];
}) {
  const className =
    status === "succeeded"
      ? "bg-green-900/30 text-green-300"
      : "bg-red-900/30 text-red-300";

  return (
    <span className={`rounded-full px-2.5 py-1 text-xs ${className}`}>{status}</span>
  );
}

function formatEventType(type: RuntimeControlEvent["type"]): string {
  if (type === "bridge_reset") {
    return "Runtime adapter reset";
  }

  return type;
}
