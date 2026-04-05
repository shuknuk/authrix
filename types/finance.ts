import type { CostAnomaly, CostBreakdownItem } from "@/types/domain";

export type FinanceSourceMode = "live" | "mixed" | "mock";

export interface BillingSourceRecord {
  id: string;
  service: string;
  label: string;
  kind: "openai" | "vercel" | "supabase" | "github_actions" | "snapshot" | "manual";
  mode: "live-file" | "mock" | "persisted";
  status: "active" | "fallback" | "missing";
  amount: number;
  currency: string;
  change: number;
  trend: CostBreakdownItem["trend"];
  lastSyncedAt: string;
  period: {
    start: string;
    end: string;
  };
  path?: string;
  notes?: string[];
}

export interface FinanceIngestionResult {
  breakdown: CostBreakdownItem[];
  anomalies: CostAnomaly[];
  totalSpend: number;
  currency: string;
  period: {
    start: string;
    end: string;
  };
  sourceMode: FinanceSourceMode;
  sources: BillingSourceRecord[];
  ingestionMessage: string;
}

export interface FinanceEvidenceRecord {
  id: string;
  title: string;
  summary: string;
  category: "source" | "spend" | "risk" | "activity";
  timestamp: string;
  relatedRecordIds: string[];
  metadata: Record<string, unknown>;
}

export interface FinanceQuestionAnswer {
  question: string;
  answer: string;
  confidence: "high" | "medium" | "low";
  sourceMode: FinanceSourceMode;
  generatedAt: string;
  evidence: FinanceEvidenceRecord[];
}
