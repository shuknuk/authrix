import type { DocsAgentInput, DocsAgentOutput } from "@/types/agents";
import type {
  DecisionRecord,
  MeetingActionItem,
  MeetingArtifact,
  SourceDocument,
} from "@/types/domain";

const DECISION_PREFIX = "Decision:";
const ACTION_PREFIX = "Action:";
const QUESTION_PREFIX = "Open question:";
const NOTE_PREFIX = "Note:";

export function docsAgent(input: DocsAgentInput): DocsAgentOutput {
  const { sourceDocument, engineeringSummary } = input;
  const lines = getDocumentLines(sourceDocument);
  const generatedAt = new Date().toISOString();

  const decisions = lines
    .filter((line) => line.startsWith(DECISION_PREFIX))
    .map((line) => line.replace(DECISION_PREFIX, "").trim());
  const actionItems = lines
    .filter((line) => line.startsWith(ACTION_PREFIX))
    .map((line, index) => parseActionItem(sourceDocument, line, index));
  const openQuestions = lines
    .filter((line) => line.startsWith(QUESTION_PREFIX))
    .map((line) => line.replace(QUESTION_PREFIX, "").trim());

  const notes = [
    ...lines
      .filter((line) => line.startsWith(NOTE_PREFIX))
      .map((line) => line.replace(NOTE_PREFIX, "").trim()),
    ...(engineeringSummary
      ? [
          `Engineering context this week focused on ${engineeringSummary.repoBreakdown
            .map((repo) => repo.repo)
            .join(", ")}.`,
        ]
      : []),
  ];

  const artifact: MeetingArtifact = {
    id: `artifact-${sourceDocument.id}`,
    workspaceId: sourceDocument.workspaceId,
    sourceDocumentId: sourceDocument.id,
    title: `${sourceDocument.title} Notes`,
    generatedAt,
    summary: buildMeetingSummary(
      sourceDocument,
      decisions,
      actionItems,
      openQuestions
    ),
    notes,
    participants: sourceDocument.participants,
    actionItems,
    decisions,
    openQuestions,
  };

  return {
    artifact,
    decisions: buildDecisionRecords(sourceDocument, decisions, generatedAt),
  };
}

function getDocumentLines(sourceDocument: SourceDocument): string[] {
  if (sourceDocument.transcript && sourceDocument.transcript.length > 0) {
    return sourceDocument.transcript
      .map((entry) => entry.text.trim())
      .filter(Boolean);
  }

  return sourceDocument.content
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function parseActionItem(
  sourceDocument: SourceDocument,
  line: string,
  index: number
): MeetingActionItem {
  const raw = line.replace(ACTION_PREFIX, "").trim();
  const match = raw.match(
    /^(.+?)\s+to\s+(.+?)(?:\s+by\s+(\d{4}-\d{2}-\d{2}))?\.?$/i
  );

  const owner = match?.[1]?.trim();
  const description = match?.[2]?.trim() ?? raw;
  const dueDate = match?.[3] ? `${match[3]}T17:00:00Z` : undefined;

  return {
    id: `meeting-action-${sourceDocument.id}-${index + 1}`,
    title: description.charAt(0).toUpperCase() + description.slice(1),
    description,
    owner,
    dueDate,
    status: "suggested",
  };
}

function buildMeetingSummary(
  sourceDocument: SourceDocument,
  decisions: string[],
  actionItems: MeetingActionItem[],
  openQuestions: string[]
): string {
  return (
    `${sourceDocument.title} produced ${decisions.length} decision` +
    `${decisions.length === 1 ? "" : "s"}, ${actionItems.length} follow-up ` +
    `${actionItems.length === 1 ? "item" : "items"}, and ${openQuestions.length} ` +
    `open question${openQuestions.length === 1 ? "" : "s"}.`
  );
}

function buildDecisionRecords(
  sourceDocument: SourceDocument,
  decisions: string[],
  createdAt: string
): DecisionRecord[] {
  return decisions.map((decision, index) => ({
    id: `decision-${sourceDocument.id}-${index + 1}`,
    workspaceId: sourceDocument.workspaceId,
    title: toDecisionTitle(decision),
    summary: decision,
    participants: sourceDocument.participants,
    status: "accepted",
    sourceAgentId: "docs",
    sourceDocumentId: sourceDocument.id,
    createdAt,
    relatedTaskIds: [],
  }));
}

function toDecisionTitle(decision: string): string {
  const trimmed = decision.replace(/\.$/, "");
  return trimmed.length > 72 ? `${trimmed.slice(0, 69)}...` : trimmed;
}
