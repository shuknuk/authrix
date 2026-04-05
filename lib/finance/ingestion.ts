import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { resolveAuthrixDataPath } from "@/lib/security/paths";
import { mockCostAnomalies, mockCostBreakdown, mockCostTotals } from "@/lib/mock/cost-data";
import type { CostAnomaly, CostBreakdownItem, CostReport } from "@/types/domain";
import type { BillingSourceRecord, FinanceIngestionResult } from "@/types/finance";

type ServiceKind = BillingSourceRecord["kind"];

interface RawServiceSnapshot {
  service?: unknown;
  label?: unknown;
  amount?: unknown;
  change?: unknown;
  trend?: unknown;
  currency?: unknown;
  period?: unknown;
  notes?: unknown;
  anomaly?: unknown;
  anomalyDescription?: unknown;
  anomalySeverity?: unknown;
}

interface SourceSpec {
  envName: string;
  defaultFile: string;
  kind: ServiceKind;
  service: string;
  label: string;
}

const DEFAULT_PERIOD = mockCostTotals.period;
const SOURCE_SPECS: SourceSpec[] = [
  {
    envName: "AUTHRIX_FINANCE_OPENAI_USAGE_PATH",
    defaultFile: "openai-usage.json",
    kind: "openai",
    service: "OpenAI API",
    label: "OpenAI API usage",
  },
  {
    envName: "AUTHRIX_FINANCE_VERCEL_USAGE_PATH",
    defaultFile: "vercel-usage.json",
    kind: "vercel",
    service: "Vercel",
    label: "Vercel spend export",
  },
  {
    envName: "AUTHRIX_FINANCE_SUPABASE_USAGE_PATH",
    defaultFile: "supabase-usage.json",
    kind: "supabase",
    service: "Supabase",
    label: "Supabase spend export",
  },
  {
    envName: "AUTHRIX_FINANCE_GITHUB_ACTIONS_USAGE_PATH",
    defaultFile: "github-actions-usage.json",
    kind: "github_actions",
    service: "GitHub Actions",
    label: "GitHub Actions usage",
  },
];

export async function loadFinanceIngestion(
  existingReport?: CostReport
): Promise<FinanceIngestionResult> {
  const snapshot = await loadSnapshotBillingExport();
  if (snapshot) {
    return snapshot;
  }

  const directSources = (
    await Promise.all(SOURCE_SPECS.map((spec) => loadServiceSnapshot(spec)))
  ).filter((entry): entry is BillingSourceRecord & { anomaly?: CostAnomaly } => Boolean(entry));

  if (directSources.length > 0) {
    return buildIngestionResult({
      sources: directSources.map(stripAnomaly),
      breakdown: directSources.map(toBreakdownItem),
      anomalies: directSources
        .map((entry) => entry.anomaly)
        .filter((entry): entry is CostAnomaly => Boolean(entry)),
      sourceMode: "live",
      currency: directSources[0]?.currency ?? "USD",
      period: directSources[0]?.period ?? DEFAULT_PERIOD,
      ingestionMessage:
        `Authrix is reading ${directSources.length} live billing export` +
        `${directSources.length === 1 ? "" : "s"} from the worker box.`,
    });
  }

  if (existingReport?.breakdown.length) {
    const persistedSources = getPersistedSources(existingReport);
    const sourceMode = getPersistedSourceMode(existingReport);
    if (persistedSources.length > 0 && sourceMode !== "mock") {
      return {
        breakdown: existingReport.breakdown.map((entry) => ({ ...entry })),
        anomalies: existingReport.anomalies.map((entry) => ({ ...entry })),
        totalSpend: existingReport.totalSpend,
        currency: existingReport.currency,
        period: { ...existingReport.period },
        sourceMode,
        sources: persistedSources,
        ingestionMessage:
          getPersistedIngestionMessage(existingReport) ??
          "Authrix is reusing the last persisted non-mock finance report.",
      };
    }
  }

  const mockSources = mockCostBreakdown.map((entry, index) => ({
    id: `billing-source-mock-${index + 1}`,
    service: entry.service,
    label: `${entry.service} demo dataset`,
    kind: "manual" as const,
    mode: "mock" as const,
    status: "fallback" as const,
    amount: entry.amount,
    currency: mockCostTotals.currency,
    change: entry.change,
    trend: entry.trend,
    lastSyncedAt: new Date().toISOString(),
    period: { ...mockCostTotals.period },
    notes: ["Bundled fallback dataset used until a billing export is configured."],
  }));

  return buildIngestionResult({
    sources: mockSources,
    breakdown: mockCostBreakdown.map((entry) => ({ ...entry })),
    anomalies: mockCostAnomalies.map((entry) => ({ ...entry })),
    sourceMode: "mock",
    currency: mockCostTotals.currency,
    period: { ...mockCostTotals.period },
    ingestionMessage:
      "Authrix is still using the bundled fallback finance dataset until a billing export is configured.",
  });
}

export function getFinanceReportMetadata(report: CostReport): {
  sourceMode: FinanceIngestionResult["sourceMode"];
  sources: BillingSourceRecord[];
  ingestionMessage?: string;
} {
  const metadata = report.metadata ?? {};
  const sourceMode = readSourceMode(metadata.sourceMode);
  const sources = Array.isArray(metadata.sources)
    ? metadata.sources
        .map(normalizePersistedSource)
        .filter((entry): entry is BillingSourceRecord => Boolean(entry))
    : [];
  const ingestionMessage =
    typeof metadata.ingestionMessage === "string" ? metadata.ingestionMessage : undefined;

  return {
    sourceMode,
    sources,
    ingestionMessage,
  };
}

function getPersistedSources(report: CostReport): BillingSourceRecord[] {
  return getFinanceReportMetadata(report).sources;
}

function getPersistedSourceMode(report: CostReport): FinanceIngestionResult["sourceMode"] {
  return getFinanceReportMetadata(report).sourceMode;
}

function getPersistedIngestionMessage(report: CostReport): string | undefined {
  return getFinanceReportMetadata(report).ingestionMessage;
}

async function loadSnapshotBillingExport(): Promise<FinanceIngestionResult | null> {
  const snapshotPath = resolveConfiguredPath(
    "AUTHRIX_FINANCE_BILLING_SNAPSHOT_PATH",
    "billing-snapshot.json"
  );
  const payload = await readJsonIfExists(snapshotPath);
  if (!payload || typeof payload !== "object" || payload === null) {
    return null;
  }

  const rawSources = Array.isArray((payload as { sources?: unknown }).sources)
    ? ((payload as { sources?: unknown[] }).sources ?? [])
    : [];
  if (rawSources.length === 0) {
    return null;
  }

  const currency = readString((payload as { currency?: unknown }).currency) ?? "USD";
  const period = readPeriod((payload as { period?: unknown }).period);
  const lastSyncedAt = await readFileTimestamp(snapshotPath);
  const normalizedSources = rawSources
    .map((entry, index) =>
      normalizeSnapshotSource(entry, {
        id: `billing-source-snapshot-${index + 1}`,
        path: snapshotPath,
        currency,
        period,
        lastSyncedAt,
      })
    )
    .filter((entry): entry is BillingSourceRecord & { anomaly?: CostAnomaly } => Boolean(entry));

  if (normalizedSources.length === 0) {
    return null;
  }

  return buildIngestionResult({
    sources: normalizedSources.map(stripAnomaly),
    breakdown: normalizedSources.map(toBreakdownItem),
    anomalies: normalizedSources
      .map((entry) => entry.anomaly)
      .filter((entry): entry is CostAnomaly => Boolean(entry)),
    sourceMode: "live",
    currency,
    period,
    ingestionMessage:
      "Authrix is reading a live billing snapshot export from the worker box.",
  });
}

async function loadServiceSnapshot(
  spec: SourceSpec
): Promise<(BillingSourceRecord & { anomaly?: CostAnomaly }) | null> {
  const targetPath = resolveConfiguredPath(spec.envName, spec.defaultFile);
  const payload = await readJsonIfExists(targetPath);
  if (!payload || typeof payload !== "object" || payload === null) {
    return null;
  }

  const raw = payload as RawServiceSnapshot;
  const amount = readNumber(raw.amount);
  if (amount === null) {
    return null;
  }

  const currency = readString(raw.currency) ?? "USD";
  const period = readPeriod(raw.period);
  const lastSyncedAt = await readFileTimestamp(targetPath);
  const change = readNumber(raw.change) ?? 0;
  const trend = readTrend(raw.trend, change);
  const service = readString(raw.service) ?? spec.service;
  const label = readString(raw.label) ?? spec.label;
  const notes = readStringArray(raw.notes);
  const anomaly = normalizeAnomaly({
    service,
    amount,
    change,
    period,
    rawAnomaly: raw.anomaly,
    rawDescription: raw.anomalyDescription,
    rawSeverity: raw.anomalySeverity,
  });

  return {
    id: `billing-source-${spec.kind}`,
    service,
    label,
    kind: spec.kind,
    mode: "live-file",
    status: "active",
    amount,
    currency,
    change,
    trend,
    lastSyncedAt,
    period,
    path: targetPath,
    notes,
    anomaly,
  };
}

function buildIngestionResult(input: {
  sources: BillingSourceRecord[];
  breakdown: CostBreakdownItem[];
  anomalies: CostAnomaly[];
  sourceMode: FinanceIngestionResult["sourceMode"];
  currency: string;
  period: FinanceIngestionResult["period"];
  ingestionMessage: string;
}): FinanceIngestionResult {
  return {
    breakdown: input.breakdown,
    anomalies: input.anomalies,
    totalSpend: input.breakdown.reduce((sum, entry) => sum + entry.amount, 0),
    currency: input.currency,
    period: input.period,
    sourceMode: input.sourceMode,
    sources: input.sources,
    ingestionMessage: input.ingestionMessage,
  };
}

function normalizeSnapshotSource(
  value: unknown,
  input: {
    id: string;
    path: string;
    currency: string;
    period: FinanceIngestionResult["period"];
    lastSyncedAt: string;
  }
): (BillingSourceRecord & { anomaly?: CostAnomaly }) | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const raw = value as RawServiceSnapshot;
  const amount = readNumber(raw.amount);
  if (amount === null) {
    return null;
  }

  const service = readString(raw.service) ?? readString(raw.label) ?? "Unknown service";
  const label = readString(raw.label) ?? `${service} billing export`;
  const change = readNumber(raw.change) ?? 0;
  const trend = readTrend(raw.trend, change);
  const notes = readStringArray(raw.notes);
  const anomaly = normalizeAnomaly({
    service,
    amount,
    change,
    period: input.period,
    rawAnomaly: raw.anomaly,
    rawDescription: raw.anomalyDescription,
    rawSeverity: raw.anomalySeverity,
  });

  return {
    id: input.id,
    service,
    label,
    kind: "snapshot",
    mode: "live-file",
    status: "active",
    amount,
    currency: input.currency,
    change,
    trend,
    lastSyncedAt: input.lastSyncedAt,
    period: input.period,
    path: input.path,
    notes,
    anomaly,
  };
}

function normalizeAnomaly(input: {
  service: string;
  amount: number;
  change: number;
  period: FinanceIngestionResult["period"];
  rawAnomaly: unknown;
  rawDescription: unknown;
  rawSeverity: unknown;
}): CostAnomaly | undefined {
  if (typeof input.rawAnomaly === "object" && input.rawAnomaly !== null) {
    const raw = input.rawAnomaly as {
      description?: unknown;
      severity?: unknown;
      detectedAt?: unknown;
    };
    const description = readString(raw.description);
    const severity = readSeverity(raw.severity);
    if (description && severity) {
      return {
        service: input.service,
        description,
        severity,
        detectedAt:
          readString(raw.detectedAt) ??
          input.period.end,
      };
    }
  }

  const inlineDescription = readString(input.rawDescription);
  const inlineSeverity = readSeverity(input.rawSeverity);
  if (inlineDescription && inlineSeverity) {
    return {
      service: input.service,
      description: inlineDescription,
      severity: inlineSeverity,
      detectedAt: input.period.end,
    };
  }

  if (Math.abs(input.change) >= 35) {
    return {
      service: input.service,
      description: `${input.service} spend changed ${formatSignedPercent(input.change)} versus the previous period.`,
      severity: Math.abs(input.change) >= 60 ? "high" : "medium",
      detectedAt: input.period.end,
    };
  }

  return undefined;
}

function toBreakdownItem(source: BillingSourceRecord): CostBreakdownItem {
  return {
    service: source.service,
    amount: source.amount,
    change: source.change,
    trend: source.trend,
  };
}

function stripAnomaly(
  source: BillingSourceRecord & { anomaly?: CostAnomaly }
): BillingSourceRecord {
  const { anomaly: _anomaly, ...record } = source;
  return record;
}

function normalizePersistedSource(value: unknown): BillingSourceRecord | null {
  if (typeof value !== "object" || value === null) {
    return null;
  }

  const record = value as Partial<BillingSourceRecord>;
  const service = typeof record.service === "string" ? record.service : null;
  const label = typeof record.label === "string" ? record.label : null;
  const amount = typeof record.amount === "number" ? record.amount : null;
  if (!service || !label || amount === null) {
    return null;
  }

  return {
    id: typeof record.id === "string" ? record.id : `billing-source-${service.toLowerCase()}`,
    service,
    label,
    kind:
      record.kind === "openai" ||
      record.kind === "vercel" ||
      record.kind === "supabase" ||
      record.kind === "github_actions" ||
      record.kind === "snapshot" ||
      record.kind === "manual"
        ? record.kind
        : "manual",
    mode:
      record.mode === "live-file" || record.mode === "persisted" || record.mode === "mock"
        ? record.mode
        : "persisted",
    status:
      record.status === "active" || record.status === "fallback" || record.status === "missing"
        ? record.status
        : "active",
    amount,
    currency: typeof record.currency === "string" ? record.currency : "USD",
    change: typeof record.change === "number" ? record.change : 0,
    trend: record.trend === "up" || record.trend === "down" ? record.trend : "stable",
    lastSyncedAt:
      typeof record.lastSyncedAt === "string" ? record.lastSyncedAt : new Date().toISOString(),
    period: isPeriod(record.period) ? record.period : { ...DEFAULT_PERIOD },
    path: typeof record.path === "string" ? record.path : undefined,
    notes: Array.isArray(record.notes)
      ? record.notes.filter((entry): entry is string => typeof entry === "string")
      : undefined,
  };
}

function readSourceMode(value: unknown): FinanceIngestionResult["sourceMode"] {
  return value === "live" || value === "mixed" ? value : "mock";
}

function resolveConfiguredPath(envName: string, defaultFile: string): string {
  const configured = process.env[envName]?.trim();
  return configured ? path.resolve(configured) : resolveAuthrixDataPath("finance", defaultFile);
}

async function readJsonIfExists(targetPath: string): Promise<unknown | null> {
  try {
    const raw = await readFile(targetPath, "utf8");
    return JSON.parse(raw) as unknown;
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      ((error as { code?: string }).code === "ENOENT" ||
        (error as { code?: string }).code === "ENOTDIR")
    ) {
      return null;
    }

    return null;
  }
}

async function readFileTimestamp(targetPath: string): Promise<string> {
  try {
    const info = await stat(targetPath);
    return info.mtime.toISOString();
  } catch {
    return new Date().toISOString();
  }
}

function readString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const entries = value.filter(
    (entry): entry is string => typeof entry === "string" && entry.trim().length > 0
  );
  return entries.length > 0 ? entries : undefined;
}

function readNumber(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function readTrend(value: unknown, change: number): CostBreakdownItem["trend"] {
  if (value === "up" || value === "down" || value === "stable") {
    return value;
  }

  if (change > 0) {
    return "up";
  }

  if (change < 0) {
    return "down";
  }

  return "stable";
}

function readSeverity(value: unknown): CostAnomaly["severity"] | null {
  return value === "high" || value === "medium" || value === "low" ? value : null;
}

function readPeriod(value: unknown): FinanceIngestionResult["period"] {
  if (isPeriod(value)) {
    return value;
  }

  return { ...DEFAULT_PERIOD };
}

function isPeriod(
  value: unknown
): value is FinanceIngestionResult["period"] {
  return (
    typeof value === "object" &&
    value !== null &&
    "start" in value &&
    "end" in value &&
    typeof (value as { start?: unknown }).start === "string" &&
    typeof (value as { end?: unknown }).end === "string"
  );
}

function formatSignedPercent(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}
