import { NextResponse } from "next/server";
import { getSuggestedTasks } from "@/lib/data/workspace";

export async function GET() {
  const tasks = await getSuggestedTasks();
  return NextResponse.json(tasks);
}
