import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/session";
import { isAuthConfigured } from "@/lib/auth/auth0";
import { createSourceDocument, getSourceDocuments } from "@/lib/data/workspace";

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
    sourceSystem?: "meeting_upload" | "notes" | "manual";
    documentType?: "transcript" | "notes" | "summary";
  };

  if (!body.title?.trim() || !body.content?.trim()) {
    return NextResponse.json(
      { error: "title and content are required" },
      { status: 400 }
    );
  }

  const snapshot = await createSourceDocument({
    title: body.title.trim(),
    content: body.content.trim(),
    participants: body.participants ?? [],
    sourceSystem: body.sourceSystem ?? "manual",
    documentType: body.documentType ?? "notes",
  });

  return NextResponse.json({
    document: snapshot.sourceDocuments[0],
    state: snapshot.state,
  });
}
