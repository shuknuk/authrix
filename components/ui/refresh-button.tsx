"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function RefreshButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="secondary"
      onClick={() => startTransition(() => router.refresh())}
      disabled={isPending}
    >
      {isPending ? "Refreshing..." : "Refresh view"}
    </Button>
  );
}
