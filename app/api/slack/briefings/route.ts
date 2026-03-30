import { NextResponse } from "next/server";
import { getOptionalSession } from "@/lib/auth/session";
import {
  listSlackBriefings,
  listSlackBriefingSchedules,
} from "@/lib/slack/store";
import { submitSlackBriefingJob } from "@/lib/data/jobs";

export async function GET() {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [schedules, briefings] = await Promise.all([
    listSlackBriefingSchedules(),
    listSlackBriefings(12),
  ]);

  return NextResponse.json({ schedules, briefings });
}

export async function POST(request: Request) {
  const session = await getOptionalSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = (await request.json().catch(() => ({}))) as {
    scheduleId?: string;
  };

  const job = await submitSlackBriefingJob(payload.scheduleId);
  return NextResponse.json({ job }, { status: 202 });
}
