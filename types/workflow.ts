import type { RiskLevel } from "@/types/domain";

export type WorkflowFollowUpKind =
  | "missing_owner"
  | "due_soon"
  | "overdue"
  | "ticket_pending";

export interface WorkflowFollowUpRecord {
  id: string;
  taskId: string;
  taskTitle: string;
  kind: WorkflowFollowUpKind;
  severity: RiskLevel;
  status: "open" | "resolved";
  message: string;
  createdAt: string;
  dueDate?: string;
  owner?: string;
  metadata: Record<string, unknown>;
}
