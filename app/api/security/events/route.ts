import { NextResponse } from "next/server";
import { isAuthConfigured } from "@/lib/auth/auth0";
import { getOptionalSession } from "@/lib/auth/session";
import { listSecurityEvents } from "@/lib/security/events";

export async function GET() {
  if (isAuthConfigured) {
    const session = await getOptionalSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const events = await listSecurityEvents();
  return NextResponse.json({ events });
}
