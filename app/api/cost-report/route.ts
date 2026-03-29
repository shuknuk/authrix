import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/session";
import { isAuthConfigured } from "@/lib/auth/auth0";
import { getCostReport, updateWorkspaceCostReport } from "@/lib/data/workspace";

export async function GET() {
  if (isAuthConfigured) {
    const session = await getOptionalSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const report = await getCostReport();
  return NextResponse.json({ report });
}

export async function PUT(request: NextRequest) {
  const session = isAuthConfigured ? await getOptionalSession() : null;

  if (isAuthConfigured && !session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();

  const snapshot = await updateWorkspaceCostReport(body);
  return NextResponse.json({
    report: snapshot.costReport,
    state: snapshot.state,
  });
}
