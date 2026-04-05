"use client";

import { Button } from "@/components/ui/button";
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

  return <Button onClick={() => requestApproval(request)}>{label}</Button>;
}
