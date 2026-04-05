import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { resolveAuthrixDataPath } from "@/lib/security/paths";
import type { TranscriptEntry } from "@/types/domain";

export const MAX_AUDIO_UPLOAD_BYTES = 25 * 1024 * 1024;
const OPENAI_TRANSCRIPTION_ENDPOINT = "https://api.openai.com/v1/audio/transcriptions";

export interface AudioTranscriptionStatus {
  mode: "mock" | "webhook" | "openai";
  configured: boolean;
  description: string;
  webhookUrl?: string;
  provider?: "mock" | "webhook" | "openai";
  model?: string;
}

interface AudioUploadRecord {
  originalName: string;
  storedName: string;
  storedPath: string;
  mimeType: string;
  sizeBytes: number;
}

interface AudioTranscriptionResult {
  transcript: TranscriptEntry[];
  provider: string;
  mode: "mock" | "webhook" | "openai";
  summary: string;
  fallbackReason?: string;
}

export async function ingestAudioMeetingUpload(input: {
  file: File;
  title?: string;
  participants: string[];
  notes?: string;
  handoffToWorkflow: boolean;
}): Promise<{
  documentInput: {
    title: string;
    participants: string[];
    transcript: TranscriptEntry[];
    sourceSystem: "meeting_upload";
    documentType: "transcript";
    metadata: Record<string, unknown>;
  };
  upload: AudioUploadRecord;
  transcription: AudioTranscriptionResult;
}> {
  const upload = await persistAudioUpload(input.file);
  const transcription = await transcribeMeetingAudio(input);
  const title = resolveMeetingTitle(input.file.name, input.title);

  return {
    documentInput: {
      title,
      participants: input.participants,
      transcript: transcription.transcript,
      sourceSystem: "meeting_upload",
      documentType: "transcript",
      metadata: {
        uploadKind: "audio",
        audioOriginalName: upload.originalName,
        audioStoredName: upload.storedName,
        audioMimeType: upload.mimeType,
        audioSizeBytes: upload.sizeBytes,
        audioStoredPath: upload.storedPath,
        transcriptionProvider: transcription.provider,
        transcriptionMode: transcription.mode,
        transcriptionSummary: transcription.summary,
        transcriptionFallbackReason: transcription.fallbackReason,
        workflowHandoffRequested: input.handoffToWorkflow,
      },
    },
    upload,
    transcription,
  };
}

export function getAudioTranscriptionStatus(): AudioTranscriptionStatus {
  const preferredProvider = resolvePreferredTranscriptionProvider();
  const webhookUrl = process.env.AUTHRIX_TRANSCRIPTION_WEBHOOK_URL?.trim();
  const openAiKey = process.env.OPENAI_API_KEY?.trim();
  const model = resolveOpenAiTranscriptionModel();

  if (
    (preferredProvider === "openai" || preferredProvider === "auto") &&
    openAiKey
  ) {
    return {
      mode: "openai",
      provider: "openai",
      configured: true,
      model,
      description:
        `Meeting audio can be sent directly to OpenAI transcription using ${model} before Docs turns it into durable artifacts.`,
    };
  }

  if (
    (preferredProvider === "webhook" || preferredProvider === "auto") &&
    webhookUrl
  ) {
    return {
      mode: "webhook",
      provider: "webhook",
      configured: true,
      webhookUrl,
      description:
        "Meeting audio can be sent through the configured transcription webhook before Docs turns it into durable artifacts.",
    };
  }

  if (preferredProvider === "openai") {
    return {
      mode: "mock",
      provider: "openai",
      configured: false,
      model,
      description:
        `OpenAI transcription is selected, but OPENAI_API_KEY is missing. Authrix will fall back to the clearly labeled mock transcript path until the key is configured.`,
    };
  }

  if (preferredProvider === "webhook") {
    return {
      mode: "mock",
      provider: "webhook",
      configured: false,
      description:
        "Webhook transcription is selected, but AUTHRIX_TRANSCRIPTION_WEBHOOK_URL is missing. Authrix will fall back to the clearly labeled mock transcript path until the webhook is configured.",
    };
  }

  return {
    mode: "mock",
    provider: "mock",
    configured: false,
    description:
      "No live transcription provider is configured, so Authrix uses a clearly labeled mock transcript fallback for uploaded meeting audio.",
  };
}

async function persistAudioUpload(file: File): Promise<AudioUploadRecord> {
  const uploadsDir = resolveAuthrixDataPath("meeting-audio");
  const extension = sanitizeExtension(path.extname(file.name || "").toLowerCase()) || ".webm";
  const storedName = `meeting-audio-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${extension}`;
  const storedPath = resolveAuthrixDataPath("meeting-audio", storedName);
  const buffer = Buffer.from(await file.arrayBuffer());

  await mkdir(uploadsDir, { recursive: true });
  await writeFile(storedPath, buffer);

  return {
    originalName: file.name || "meeting-audio",
    storedName,
    storedPath,
    mimeType: file.type || "application/octet-stream",
    sizeBytes: buffer.byteLength,
  };
}

async function transcribeMeetingAudio(input: {
  file: File;
  title?: string;
  participants: string[];
  notes?: string;
  handoffToWorkflow: boolean;
}): Promise<AudioTranscriptionResult> {
  const status = getAudioTranscriptionStatus();

  if (status.mode === "openai") {
    try {
      return await transcribeWithOpenAI(input.file);
    } catch (error) {
      const fallback = createMockTranscript(input);
      return {
        ...fallback,
        fallbackReason: error instanceof Error ? error.message : "Unknown OpenAI transcription error.",
      };
    }
  }

  if (status.mode === "webhook" && status.webhookUrl) {
    try {
      return await transcribeWithWebhook(status.webhookUrl, input);
    } catch (error) {
      const fallback = createMockTranscript(input);
      return {
        ...fallback,
        fallbackReason: error instanceof Error ? error.message : "Unknown webhook transcription error.",
      };
    }
  }

  return createMockTranscript(input);
}

async function transcribeWithOpenAI(file: File): Promise<AudioTranscriptionResult> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  const form = new FormData();
  const blob = new Blob([await file.arrayBuffer()], {
    type: file.type || "application/octet-stream",
  });
  const model = resolveOpenAiTranscriptionModel();

  form.append("file", blob, file.name || "meeting-audio");
  form.append("model", model);
  form.append("response_format", "json");

  const response = await fetch(OPENAI_TRANSCRIPTION_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: form,
  });

  if (!response.ok) {
    const errorText = truncate(await response.text(), 200);
    throw new Error(`OpenAI transcription failed with ${response.status}. ${errorText}`.trim());
  }

  const payload = (await response.json()) as {
    text?: unknown;
  };
  const transcript = normalizeTranscriptPayload(undefined, payload.text);

  if (transcript.length === 0) {
    throw new Error("OpenAI transcription returned no usable text.");
  }

  return {
    transcript,
    provider: `openai-${model}`,
    mode: "openai",
    summary: `Meeting audio was transcribed directly through OpenAI using ${model}.`,
  };
}

async function transcribeWithWebhook(
  webhookUrl: string,
  input: {
    file: File;
    title?: string;
    participants: string[];
    notes?: string;
    handoffToWorkflow: boolean;
  }
): Promise<AudioTranscriptionResult> {
  const form = new FormData();
  const blob = new Blob([await input.file.arrayBuffer()], {
    type: input.file.type || "application/octet-stream",
  });

  form.append("file", blob, input.file.name || "meeting-audio");
  form.append("title", input.title?.trim() || "");
  form.append("participants", JSON.stringify(input.participants));
  form.append("notes", input.notes?.trim() || "");
  form.append("handoffToWorkflow", String(input.handoffToWorkflow));

  const headers: Record<string, string> = {};
  const token = process.env.AUTHRIX_TRANSCRIPTION_WEBHOOK_TOKEN?.trim();
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers,
    body: form,
  });

  if (!response.ok) {
    throw new Error(`Webhook transcription failed with ${response.status}.`);
  }

  const payload = (await response.json()) as {
    provider?: unknown;
    transcript?: unknown;
    transcriptText?: unknown;
    summary?: unknown;
  };
  const transcript = normalizeTranscriptPayload(payload.transcript, payload.transcriptText);

  if (transcript.length === 0) {
    throw new Error("Webhook transcription returned no usable transcript.");
  }

  return {
    transcript,
    provider:
      typeof payload.provider === "string" && payload.provider.trim()
        ? payload.provider.trim()
        : "webhook",
    mode: "webhook",
    summary:
      typeof payload.summary === "string" && payload.summary.trim()
        ? payload.summary.trim()
        : "Meeting audio was transcribed through the configured webhook.",
  };
}

function createMockTranscript(input: {
  file: File;
  title?: string;
  participants: string[];
  notes?: string;
  handoffToWorkflow: boolean;
}): AudioTranscriptionResult {
  const title = resolveMeetingTitle(input.file.name, input.title);
  const participants = input.participants.length > 0 ? input.participants : ["Facilitator", "Team"];
  const meetingLines = buildMockMeetingLines({
    title,
    participants,
    notes: input.notes,
    handoffToWorkflow: input.handoffToWorkflow,
  });

  return {
    transcript: meetingLines.map((line, index) => ({
      speaker: participants[index % participants.length] || `Speaker ${index + 1}`,
      text: line,
      timestamp: formatTranscriptTimestamp(index),
    })),
    provider: "mock-transcription",
    mode: "mock",
    summary:
      "Uploaded audio was persisted locally and converted through the mock transcription fallback because no live transcription webhook is configured.",
  };
}

function buildMockMeetingLines(input: {
  title: string;
  participants: string[];
  notes?: string;
  handoffToWorkflow: boolean;
}): string[] {
  const noteLines = (input.notes ?? "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 8);
  const classified = noteLines.map(classifyMeetingLine);
  const lines = [
    `Note: ${input.title} was uploaded through the mock audio intake path. Review the stored recording before taking any external action.`,
    ...classified,
  ];

  if (!lines.some((line) => line.startsWith("Decision:"))) {
    lines.push(
      `Decision: The team wants ${input.title.toLowerCase()} captured as a durable meeting artifact in Authrix.`
    );
  }

  if (input.handoffToWorkflow && !lines.some((line) => line.startsWith("Action:"))) {
    const owner = input.participants[0] || "Operations";
    lines.push(`Action: ${owner} to convert this meeting into tracked follow-up work by ${buildDueDate()}`);
  }

  if (!lines.some((line) => line.startsWith("Open question:"))) {
    lines.push(
      input.handoffToWorkflow
        ? "Open question: Which follow-up should Workflow prioritize first from this meeting?"
        : "Open question: Should this meeting be handed off to Workflow for owners and deadlines?"
    );
  }

  return lines;
}

function classifyMeetingLine(line: string): string {
  if (/^(Decision|Action|Open question|Note):/i.test(line)) {
    return line;
  }

  const normalized = line.toLowerCase();
  if (normalized.includes("decide") || normalized.includes("decision")) {
    return `Decision: ${trimTrailingPunctuation(line)}`;
  }

  if (
    normalized.includes("action") ||
    normalized.includes("follow up") ||
    normalized.includes("owner") ||
    normalized.includes("todo")
  ) {
    return `Action: ${trimTrailingPunctuation(line)}`;
  }

  if (
    normalized.includes("question") ||
    normalized.includes("unclear") ||
    normalized.includes("unsure") ||
    normalized.includes("need to confirm")
  ) {
    return `Open question: ${trimTrailingPunctuation(line)}`;
  }

  return `Note: ${trimTrailingPunctuation(line)}`;
}

function normalizeTranscriptPayload(
  transcript: unknown,
  transcriptText: unknown
): TranscriptEntry[] {
  if (Array.isArray(transcript)) {
    return transcript
      .flatMap((entry, index) => {
        if (typeof entry !== "object" || entry === null) {
          return [];
        }

        const candidate = entry as {
          speaker?: unknown;
          text?: unknown;
          timestamp?: unknown;
          time?: unknown;
        };
        const text = typeof candidate.text === "string" ? candidate.text.trim() : "";
        if (!text) {
          return [];
        }

        return [
          {
            speaker:
              typeof candidate.speaker === "string" && candidate.speaker.trim()
                ? candidate.speaker.trim()
                : `Speaker ${index + 1}`,
            text,
            timestamp:
              typeof candidate.timestamp === "string" && candidate.timestamp.trim()
                ? candidate.timestamp.trim()
                : typeof candidate.time === "string" && candidate.time.trim()
                  ? candidate.time.trim()
                  : formatTranscriptTimestamp(index),
          },
        ];
      })
      .slice(0, 500);
  }

  if (typeof transcriptText === "string" && transcriptText.trim()) {
    return transcriptText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 500)
      .map((line, index) => ({
        speaker: "Speaker 1",
        text: line,
        timestamp: formatTranscriptTimestamp(index),
      }));
  }

  return [];
}

function resolveMeetingTitle(fileName: string, title?: string): string {
  const explicitTitle = title?.trim();
  if (explicitTitle) {
    return explicitTitle;
  }

  const baseName = fileName.replace(/\.[^/.]+$/, "").replace(/[-_]+/g, " ").trim();
  return baseName ? toTitleCase(baseName) : "Meeting Audio Upload";
}

function sanitizeExtension(extension: string): string {
  return /^[.][a-z0-9]+$/i.test(extension) ? extension : "";
}

function formatTranscriptTimestamp(index: number): string {
  const minutes = Math.floor(index / 2)
    .toString()
    .padStart(2, "0");
  const seconds = index % 2 === 0 ? "00" : "30";
  return `00:${minutes}:${seconds}`;
}

function buildDueDate(): string {
  const due = new Date();
  due.setDate(due.getDate() + 3);
  return due.toISOString().slice(0, 10);
}

function toTitleCase(value: string): string {
  return value.replace(/\b\w/g, (char) => char.toUpperCase());
}

function trimTrailingPunctuation(value: string): string {
  return value.trim().replace(/[.]+$/, "");
}

function resolvePreferredTranscriptionProvider(): "auto" | "webhook" | "openai" {
  const raw = process.env.AUTHRIX_TRANSCRIPTION_PROVIDER?.trim().toLowerCase();
  if (raw === "webhook") {
    return "webhook";
  }

  if (raw === "openai") {
    return "openai";
  }

  return "auto";
}

function resolveOpenAiTranscriptionModel(): string {
  return process.env.OPENAI_TRANSCRIPTION_MODEL?.trim() || "whisper-1";
}

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}
