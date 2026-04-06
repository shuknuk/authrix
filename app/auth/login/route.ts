import { auth0 } from "@/lib/auth/auth0";
import { redirect } from "next/navigation";

export async function GET() {
  if (!auth0) {
    return new Response("Auth0 not configured", { status: 500 });
  }

  // Use startInteractiveLogin to initiate the login flow
  const response = await auth0.startInteractiveLogin();

  // Return the response which will redirect to Auth0
  return response;
}
