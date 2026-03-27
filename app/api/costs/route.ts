import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/client";
import { devopsAgent } from "@/lib/agents/devopsAgent";
import { getMockUsageCostInput } from "@/lib/mock/costs";

export async function POST() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json(devopsAgent(getMockUsageCostInput()));
}
