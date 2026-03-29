import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/session";
import { isAuthConfigured } from "@/lib/auth/auth0";
import { createSourceDocument, getSourceDocuments } from "@/lib/data/workspace";
import type { TranscriptEntry } from "@/types/domain";

const MAX_TITLE_LENGTH = 180;
const MAX_CONTENT_LENGTH = 20_000;
const MAX_TRANSCRIPT_ENTRIES = 500;
const MAX_PARTICIPANTS = 25;

export async function GET() {
  if (isAuthConfigured) {
    const session = await getOptionalSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const documents = await getSourceDocuments();
  return NextResponse.json({ documents });
}

export async function POST(request: NextRequest) {
  const session = isAuthConfigured ? await getOptionalSession() : null;

  if (isAuthConfigured && !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as {
    title?: string;
    content?: string;
    participants?: string[];
    transcript?: TranscriptEntry[];
    metadata?: Record<string, unknown>;
    sourceSystem?: "meeting_upload" | "notes" | "manual";
    documentType?: "transcript" | "notes" | "summary";
  };

  const hasTranscript = (body.transcript?.length ?? 0) > 0;
  const title = body.title?.trim();
  const content = body.content?.trim();
  const participants = (body.participants ?? [])
    .filter((participant): participant is string => typeof participant === "string")
    .map((participant) => participant.trim())
    .filter(Boolean)
    .slice(0, MAX_PARTICIPANTS);
  const transcript = (body.transcript ?? [])
    .slice(0, MAX_TRANSCRIPT_ENTRIES)
    .flatMap((entry) => {
      if (
        !entry ||
        typeof entry.speaker !== "string" ||
        typeof entry.text !== "string" ||
        typeof entry.timestamp !== "string"
      ) {
        return [];
      }

      const normalizedEntry = {
        speaker: entry.speaker.trim(),
        text: entry.text.trim(),
        timestamp: entry.timestamp.trim(),
      };

      return normalizedEntry.speaker && normalizedEntry.text
        ? [normalizedEntry]
        : [];
    });

  if (!title || (!content && !hasTranscript)) {
    return NextResponse.json(
      { error: "title and either content or transcript are required" },
      { status: 400 }
    );
  }

  if (title.length > MAX_TITLE_LENGTH) {
    return NextResponse.json(
      { error: `title must be ${MAX_TITLE_LENGTH} characters or fewer` },
      { status: 400 }
    );
  }

  if (content && content.length > MAX_CONTENT_LENGTH) {
    return NextResponse.json(
      { error: `content must be ${MAX_CONTENT_LENGTH} characters or fewer` },
      { status: 400 }
    );
  }

  const result = await createSourceDocument({
    title,
    content,
    participants,
    sourceSystem: body.sourceSystem ?? "manual",
    documentType: body.documentType,
    transcript,
    metadata: body.metadata,
  });

  return NextResponse.json({
    document: result.document,
    artifact: result.artifact,
    decisions: result.decisions,
    tasks: result.tasks,
    state: result.snapshot.state,
  });
}
