import { auth0 } from "@/lib/auth/auth0";
import { getSlackConnectionName, getSlackConnectionScopes } from "@/lib/auth/slack-token-vault";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  if (!auth0) {
    return NextResponse.json({ error: "Auth0 not configured" }, { status: 500 });
  }

  const connectionName = getSlackConnectionName();
  if (!connectionName) {
    return NextResponse.redirect(
      new URL("/connections?error=slack-not-configured", request.url),
    );
  }

  const returnTo =
    new URL(request.url).searchParams.get("returnTo") ?? "/connections";

  return auth0.connectAccount({
    connection: connectionName,
    scopes: getSlackConnectionScopes(),
    returnTo,
  });
}
