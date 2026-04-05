import { NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/session";
import { isAuthConfigured } from "@/lib/auth/auth0";
import { devopsAgent } from "@/lib/agents/devopsAgent";
import { getMockUsageCostInput } from "@/lib/mock/costs";

export async function POST() {
  if (isAuthConfigured) {
    const session = await getOptionalSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  return NextResponse.json(devopsAgent(getMockUsageCostInput()));
}
