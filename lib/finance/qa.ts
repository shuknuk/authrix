import { getWorkspaceSnapshot } from "@/lib/data/workspace";
import { loadSlackWorkspaceState } from "@/lib/slack/store";
import { getFinanceReportMetadata } from "@/lib/finance/ingestion";
import type { CostAnomaly, CostBreakdownItem, WorkspaceSnapshot } from "@/types/domain";
import type { BillingSourceRecord, FinanceEvidenceRecord, FinanceQuestionAnswer } from "@/types/finance";

export async function answerFinanceQuestion(input: {
  question: string;
  snapshot?: WorkspaceSnapshot;
}): Promise<FinanceQuestionAnswer> {
  const snapshot = input.snapshot ?? (await getWorkspaceSnapshot());
  const slackState = await loadSlackWorkspaceState().catch(() => null);
  const report = snapshot.costReport;
  const financeMetadata = getFinanceReportMetadata(report);
  const sourceMode = financeMetadata.sourceMode;
  const sources = financeMetadata.sources;
  const question = input.question.trim();
  const normalized = question.toLowerCase();
  const topDriver = [...report.breakdown].sort((left, right) => right.amount - left.amount)[0];
  const serviceBreakdown = findRelevantService(report.breakdown, normalized);
  const serviceAnomaly = serviceBreakdown
    ? report.anomalies.find((anomaly) => normalizeText(anomaly.service) === normalizeText(serviceBreakdown.service))
    : null;
  const modelDispatchCount =
    slackState?.dispatches.filter((dispatch) => dispatch.routeMode === "model").length ?? 0;
  const latestActivityTime =
    snapshot.engineeringActivities[0]?.timestamp ??
    snapshot.engineeringSummary.generatedAt;
  const evidence = buildEvidence({
    snapshot,
    sources,
    sourceMode,
    breakdown: serviceBreakdown ?? topDriver ?? null,
    anomaly: serviceAnomaly ?? report.anomalies[0] ?? null,
    modelDispatchCount,
  });

  let answer: string;
  let confidence: FinanceQuestionAnswer["confidence"] = "medium";

  if (!report.breakdown.length) {
    answer =
      "Authrix does not have any spend lines to analyze yet, so Finance/Ops cannot answer this with evidence until a billing export is connected.";
    confidence = "low";
  } else if (hasAny(normalized, ["risk", "concern", "anomaly", "problem"])) {
    answer = buildRiskAnswer(report, topDriver, serviceAnomaly ?? report.anomalies[0] ?? null, sourceMode);
    confidence = "high";
  } else if (serviceBreakdown && hasAny(normalized, ["why", "change", "changed", "increase", "up", "spike"])) {
    answer = buildServiceChangeAnswer(
      serviceBreakdown,
      serviceAnomaly ?? null,
      latestActivityTime,
      modelDispatchCount
    );
    confidence = serviceAnomaly ? "high" : "medium";
  } else if (serviceBreakdown) {
    answer = buildServiceAnswer(serviceBreakdown, serviceAnomaly ?? null, sourceMode);
    confidence = "high";
  } else if (hasAny(normalized, ["total", "overall", "how much", "spend", "cost this", "burn"])) {
    answer = buildTotalSpendAnswer(report, topDriver, sourceMode);
    confidence = "high";
  } else if (hasAny(normalized, ["biggest", "highest", "most", "driver"])) {
    answer = buildDriverAnswer(topDriver, report, sourceMode);
    confidence = topDriver ? "high" : "medium";
  } else {
    answer = buildGeneralAnswer(report, topDriver, modelDispatchCount, sourceMode);
  }

  return {
    question,
    answer,
    confidence,
    sourceMode,
    generatedAt: new Date().toISOString(),
    evidence,
  };
}

export async function executeFinanceQuestionRun(question: string): Promise<{
  outputSummary: string;
  metadata: Record<string, unknown>;
  answer: FinanceQuestionAnswer;
}> {
  const startedAt = Date.now();
  const answer = await answerFinanceQuestion({ question });

  return {
    outputSummary: answer.answer,
    metadata: {
      executionTimeMs: Date.now() - startedAt,
      timestamp: answer.generatedAt,
      provider: "local",
      evidenceCount: answer.evidence.length,
      sourceMode: answer.sourceMode,
      confidence: answer.confidence,
    },
    answer,
  };
}

function buildEvidence(input: {
  snapshot: WorkspaceSnapshot;
  sources: BillingSourceRecord[];
  sourceMode: FinanceQuestionAnswer["sourceMode"];
  breakdown: CostBreakdownItem | null;
  anomaly: CostAnomaly | null;
  modelDispatchCount: number;
}): FinanceEvidenceRecord[] {
  const records: FinanceEvidenceRecord[] = [];

  const primarySource =
    input.sources.find(
      (source) =>
        input.breakdown &&
        normalizeText(source.service) === normalizeText(input.breakdown.service)
    ) ?? input.sources[0];
  if (primarySource) {
    records.push({
      id: `finance-evidence-source-${primarySource.id}`,
      title: `${primarySource.service} billing source`,
      summary:
        input.sourceMode === "live"
          ? `${primarySource.label} was ingested from a live worker-box export at ${new Date(primarySource.lastSyncedAt).toLocaleString()}.`
          : `${primarySource.label} is coming from fallback or persisted Authrix data.`,
      category: "source",
      timestamp: primarySource.lastSyncedAt,
      relatedRecordIds: [],
      metadata: {
        amount: primarySource.amount,
        currency: primarySource.currency,
        mode: primarySource.mode,
        sourceMode: input.sourceMode,
      },
    });
  }

  if (input.breakdown) {
    records.push({
      id: `finance-evidence-breakdown-${normalizeText(input.breakdown.service)}`,
      title: `${input.breakdown.service} spend line`,
      summary: `${input.breakdown.service} accounts for $${input.breakdown.amount.toFixed(2)} with a ${formatSignedPercent(
        input.breakdown.change
      )} period-over-period change.`,
      category: "spend",
      timestamp: input.snapshot.costReport.generatedAt,
      relatedRecordIds: [input.snapshot.costReport.id],
      metadata: {
        service: input.breakdown.service,
        amount: input.breakdown.amount,
        change: input.breakdown.change,
        trend: input.breakdown.trend,
      },
    });
  }

  if (input.anomaly) {
    records.push({
      id: `finance-evidence-anomaly-${normalizeText(input.anomaly.service)}`,
      title: `${input.anomaly.service} anomaly`,
      summary: input.anomaly.description,
      category: "risk",
      timestamp: input.anomaly.detectedAt,
      relatedRecordIds: [input.snapshot.costReport.id],
      metadata: {
        severity: input.anomaly.severity,
        service: input.anomaly.service,
      },
    });
  }

  records.push({
    id: "finance-evidence-workspace-activity",
    title: "Workspace activity context",
    summary:
      `${input.snapshot.engineeringActivities.length} engineering activity record(s), ` +
      `${input.snapshot.tasks.length} tracked task(s), and ` +
      `${input.modelDispatchCount} model-routed Slack conversation(s) are currently visible in Authrix.`,
    category: "activity",
    timestamp: input.snapshot.state.refreshedAt,
    relatedRecordIds: [
      input.snapshot.engineeringSummary.id,
      input.snapshot.costReport.id,
    ],
    metadata: {
      engineeringActivityCount: input.snapshot.engineeringActivities.length,
      taskCount: input.snapshot.tasks.length,
      modelDispatchCount: input.modelDispatchCount,
    },
  });

  return records;
}

function buildTotalSpendAnswer(
  report: WorkspaceSnapshot["costReport"],
  topDriver: CostBreakdownItem | undefined,
  sourceMode: FinanceQuestionAnswer["sourceMode"]
): string {
  const period = `${new Date(report.period.start).toLocaleDateString()}-${new Date(
    report.period.end
  ).toLocaleDateString()}`;
  const driverText = topDriver
    ? ` The biggest line item is ${topDriver.service} at $${topDriver.amount.toFixed(2)}.`
    : "";

  return `Tracked spend for ${period} is $${report.totalSpend.toFixed(2)} ${report.currency}.` +
    `${driverText} Current finance posture is ${report.riskLevel} risk, using ${sourceMode} source data.`;
}

function buildDriverAnswer(
  topDriver: CostBreakdownItem | undefined,
  report: WorkspaceSnapshot["costReport"],
  sourceMode: FinanceQuestionAnswer["sourceMode"]
): string {
  if (!topDriver) {
    return `Authrix can see total spend, but there is no service breakdown yet. Current source mode is ${sourceMode}.`;
  }

  return `${topDriver.service} is currently the biggest spend driver at $${topDriver.amount.toFixed(
    2
  )}, with a ${formatSignedPercent(topDriver.change)} change versus the prior period. Overall tracked spend is $${report.totalSpend.toFixed(
    2
  )} ${report.currency}.`;
}

function buildRiskAnswer(
  report: WorkspaceSnapshot["costReport"],
  topDriver: CostBreakdownItem | undefined,
  anomaly: CostAnomaly | null,
  sourceMode: FinanceQuestionAnswer["sourceMode"]
): string {
  if (anomaly) {
    return `Finance/Ops is currently ${report.riskLevel} risk. The sharpest signal is ${anomaly.service}: ${anomaly.description} ${
      topDriver ? `The largest spend line is still ${topDriver.service} at $${topDriver.amount.toFixed(2)}.` : ""
    } Source mode is ${sourceMode}.`;
  }

  return `Finance/Ops is currently ${report.riskLevel} risk with no explicit anomaly entries, but Authrix still sees a total of $${report.totalSpend.toFixed(
    2
  )} ${report.currency} across the tracked services.`;
}

function buildServiceAnswer(
  service: CostBreakdownItem,
  anomaly: CostAnomaly | null,
  sourceMode: FinanceQuestionAnswer["sourceMode"]
): string {
  return `${service.service} is currently tracked at $${service.amount.toFixed(2)} with a ${formatSignedPercent(
    service.change
  )} change versus the prior period.${anomaly ? ` Authrix also flagged it: ${anomaly.description}` : ""} Source mode is ${sourceMode}.`;
}

function buildServiceChangeAnswer(
  service: CostBreakdownItem,
  anomaly: CostAnomaly | null,
  latestActivityTime: string,
  modelDispatchCount: number
): string {
  if (anomaly) {
    return `${service.service} moved ${formatSignedPercent(service.change)} and Authrix flagged it as ${anomaly.severity} severity. ${anomaly.description} The nearest workspace-side context is ongoing activity through ${new Date(
      latestActivityTime
    ).toLocaleString()} and ${modelDispatchCount} model-routed Slack conversation(s).`;
  }

  return `${service.service} changed ${formatSignedPercent(
    service.change
  )}, but there is no explicit anomaly record yet. Authrix can still see current workspace activity and model-routed chat load that may explain the movement.`;
}

function buildGeneralAnswer(
  report: WorkspaceSnapshot["costReport"],
  topDriver: CostBreakdownItem | undefined,
  modelDispatchCount: number,
  sourceMode: FinanceQuestionAnswer["sourceMode"]
): string {
  const driverText = topDriver
    ? `${topDriver.service} is the largest visible line item at $${topDriver.amount.toFixed(2)}.`
    : "Authrix does not yet have a dominant service line item.";

  return `Tracked spend is $${report.totalSpend.toFixed(2)} ${report.currency} and the current posture is ${report.riskLevel} risk. ${driverText} Authrix is also seeing ${modelDispatchCount} model-routed Slack conversation(s), which helps explain hosted reasoning load. Source mode is ${sourceMode}.`;
}

function findRelevantService(
  breakdown: CostBreakdownItem[],
  question: string
): CostBreakdownItem | undefined {
  const normalizedQuestion = normalizeText(question);
  return breakdown.find((entry) => {
    const normalizedService = normalizeText(entry.service);
    const tokens = normalizedService.split(" ").filter((token) => token.length >= 4);

    return (
      normalizedQuestion.includes(normalizedService) ||
      normalizedQuestion.includes(normalizedService.replace(/\s+/g, "")) ||
      tokens.some((token) => normalizedQuestion.includes(token))
    );
  });
}

function normalizeText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function hasAny(input: string, patterns: string[]): boolean {
  return patterns.some((pattern) => input.includes(pattern));
}

function formatSignedPercent(value: number): string {
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}%`;
}
