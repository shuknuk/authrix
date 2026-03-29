import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/session";
import { isAuthConfigured } from "@/lib/auth/auth0";
import { createSourceDocument, getSourceDocuments } from "@/lib/data/workspace";
import type { TranscriptEntry } from "@/types/domain";

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

  if (!body.title?.trim() || (!body.content?.trim() && !hasTranscript)) {
    return NextResponse.json(
      { error: "title and either content or transcript are required" },
      { status: 400 }
    );
  }

  const result = await createSourceDocument({
    title: body.title.trim(),
    content: body.content?.trim(),
    participants: body.participants ?? [],
    sourceSystem: body.sourceSystem ?? "manual",
    documentType: body.documentType,
    transcript: body.transcript,
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
