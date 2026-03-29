import { NextRequest, NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/session";
import { isAuthConfigured } from "@/lib/auth/auth0";
import { getCostReport, updateWorkspaceCostReport } from "@/lib/data/workspace";
import type { CostReport } from "@/types/domain";

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

  const body = (await request.json()) as Partial<CostReport>;

  if (
    !body ||
    !body.id ||
    !body.period?.start ||
    !body.period?.end ||
    typeof body.totalSpend !== "number" ||
    !body.currency ||
    !Array.isArray(body.breakdown) ||
    !Array.isArray(body.anomalies) ||
    !body.riskLevel ||
    !body.summary
  ) {
    return NextResponse.json(
      {
        error:
          "A valid cost report payload is required: id, period, totalSpend, currency, breakdown, anomalies, riskLevel, and summary.",
      },
      { status: 400 }
    );
  }

  if (
    !Number.isFinite(body.totalSpend) ||
    body.breakdown.some(
      (entry) =>
        !entry ||
        typeof entry.service !== "string" ||
        !Number.isFinite(entry.amount) ||
        !Number.isFinite(entry.change)
    ) ||
    body.anomalies.some(
      (entry) =>
        !entry ||
        typeof entry.service !== "string" ||
        typeof entry.description !== "string" ||
        !entry.detectedAt
    )
  ) {
    return NextResponse.json(
      { error: "Cost report contains invalid numeric or anomaly values." },
      { status: 400 }
    );
  }

  const snapshot = await updateWorkspaceCostReport(body as CostReport);
  return NextResponse.json({
    report: snapshot.costReport,
    state: snapshot.state,
  });
}
