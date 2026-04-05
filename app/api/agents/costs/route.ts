import { NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/session";
import { isAuthConfigured } from "@/lib/auth/auth0";
import { getCostReport } from "@/lib/data/workspace";
import { answerFinanceQuestion } from "@/lib/finance/qa";

export async function GET() {
  if (isAuthConfigured) {
    const session = await getOptionalSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const report = await getCostReport();
  return NextResponse.json(report);
}

export async function POST(request: Request) {
  if (isAuthConfigured) {
    const session = await getOptionalSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const payload = (await request.json().catch(() => ({}))) as {
    question?: string;
  };
  const question = typeof payload.question === "string" ? payload.question.trim() : "";
  if (!question) {
    return NextResponse.json(
      { error: "A finance question is required." },
      { status: 400 }
    );
  }

  const answer = await answerFinanceQuestion({ question });
  return NextResponse.json({ answer });
}
