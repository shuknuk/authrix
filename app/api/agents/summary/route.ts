import { NextResponse } from "next/server";
import { getEngineeringSummary } from "@/lib/data/workspace";

export async function GET() {
  const summary = await getEngineeringSummary();
  return NextResponse.json(summary);
}
