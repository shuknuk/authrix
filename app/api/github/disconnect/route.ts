import { NextResponse } from "next/server";
import { clearGitHubSession } from "@/lib/github/session";

export async function POST(request: Request) {
  await clearGitHubSession();

  return NextResponse.redirect(
    new URL("/connections?disconnected=1", request.url),
  );
}
