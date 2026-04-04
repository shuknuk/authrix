import { NextResponse } from "next/server";
import { isAuthConfigured } from "@/lib/auth/auth0";
import { getOptionalSession } from "@/lib/auth/session";
import { resetRuntimeAdapter } from "@/lib/runtime/control";

export async function POST() {
  if (isAuthConfigured) {
    const session = await getOptionalSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const result = await resetRuntimeAdapter();
  return NextResponse.json(result, { status: 202 });
}
