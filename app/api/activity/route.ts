import { NextResponse } from "next/server";
import { getTimelineEntries } from "@/lib/data/workspace";

export async function GET() {
  const timeline = await getTimelineEntries();
  return NextResponse.json(timeline);
}
