import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { isAuth0Configured } from "@/lib/auth/config";

let cachedClient: Auth0Client | null | undefined;

export function getAuth0Client() {
  if (!isAuth0Configured()) {
    return null;
  }

  if (!cachedClient) {
    cachedClient = new Auth0Client();
  }

  return cachedClient;
}

export async function getSession() {
  const auth0 = getAuth0Client();
  return auth0 ? auth0.getSession() : null;
}
