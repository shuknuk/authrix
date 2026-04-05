"use client";

import { useApprovalModal } from "@/components/ui/approval-modal-provider";
import type { ApprovalRequest } from "@/types/authrix";

export function ActionRequestButton({
  request,
  label,
}: {
  request: ApprovalRequest;
  label: string;
}) {
  const { requestApproval } = useApprovalModal();

  return (
    <button
      onClick={() => requestApproval(request)}
      className="inline-flex items-center justify-center rounded-lg bg-[var(--primary)] px-4 py-2 text-sm font-medium text-[var(--primary-foreground)] transition-colors hover:bg-[var(--bronze-soft)]"
    >
      {label}
    </button>
  );
}
