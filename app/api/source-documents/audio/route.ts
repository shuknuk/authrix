import { NextRequest, NextResponse } from "next/server";
import { isAuthConfigured } from "@/lib/auth/auth0";
import { getOptionalSession } from "@/lib/auth/session";
import {
  getAudioTranscriptionStatus,
  ingestAudioMeetingUpload,
  MAX_AUDIO_UPLOAD_BYTES,
} from "@/lib/docs/audio";
import { createSourceDocument } from "@/lib/data/workspace";

const MAX_TITLE_LENGTH = 180;
const MAX_PARTICIPANTS = 25;

export async function POST(request: NextRequest) {
  const session = isAuthConfigured ? await getOptionalSession() : null;

  if (isAuthConfigured && !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const audioField = form.get("audio") ?? form.get("file");

  if (!(audioField instanceof File)) {
    return NextResponse.json(
      { error: "An audio file is required under the audio or file field." },
      { status: 400 }
    );
  }

  if (audioField.size <= 0) {
    return NextResponse.json({ error: "The uploaded audio file is empty." }, { status: 400 });
  }

  if (audioField.size > MAX_AUDIO_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: `Audio uploads must be ${MAX_AUDIO_UPLOAD_BYTES} bytes or smaller.` },
      { status: 400 }
    );
  }

  if (audioField.type && !audioField.type.toLowerCase().startsWith("audio/")) {
    return NextResponse.json(
      { error: "Only audio/* uploads are accepted by the meeting audio intake route." },
      { status: 400 }
    );
  }

  const title = readOptionalString(form, "title");
  if (title && title.length > MAX_TITLE_LENGTH) {
    return NextResponse.json(
      { error: `title must be ${MAX_TITLE_LENGTH} characters or fewer` },
      { status: 400 }
    );
  }

  const participants = readParticipants(form).slice(0, MAX_PARTICIPANTS);
  const notes = readOptionalString(form, "notes");
  const handoffToWorkflow = readBoolean(form, "handoffToWorkflow");
  const intake = await ingestAudioMeetingUpload({
    file: audioField,
    title: title ?? undefined,
    participants,
    notes: notes ?? undefined,
    handoffToWorkflow,
  });
  const result = await createSourceDocument(intake.documentInput);
  const transcriptionStatus = getAudioTranscriptionStatus();

  return NextResponse.json(
    {
      document: result.document,
      artifact: result.artifact,
      decisions: result.decisions,
      tasks: handoffToWorkflow ? result.tasks : [],
      upload: intake.upload,
      transcription: {
        provider: intake.transcription.provider,
        mode: intake.transcription.mode,
        summary: intake.transcription.summary,
        fallbackReason: intake.transcription.fallbackReason,
        configuredMode: transcriptionStatus.mode,
      },
      workflowHandoff: {
        requested: handoffToWorkflow,
        tasksCreated: handoffToWorkflow ? result.tasks.length : 0,
      },
      state: result.snapshot.state,
    },
    { status: 201 }
  );
}

function readOptionalString(form: FormData, key: string): string | null {
  const value = form.get(key);
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function readParticipants(form: FormData): string[] {
  const repeated = form
    .getAll("participant")
    .filter((entry): entry is string => typeof entry === "string")
    .map((entry) => entry.trim())
    .filter(Boolean);

  if (repeated.length > 0) {
    return repeated;
  }

  const combined = readOptionalString(form, "participants");
  if (!combined) {
    return [];
  }

  return combined
    .split(/[,\n]/)
    .map((entry) => entry.trim())
    .filter(Boolean);
}

function readBoolean(form: FormData, key: string): boolean {
  const value = form.get(key);
  if (typeof value !== "string") {
    return false;
  }

  return value === "true" || value === "1" || value.toLowerCase() === "yes";
}
