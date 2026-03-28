import { NextResponse } from "next/server";
import { getCostReport } from "@/lib/data/workspace";

export async function GET() {
  const report = await getCostReport();
  return NextResponse.json(report);
}
