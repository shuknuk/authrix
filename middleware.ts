import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth/auth0";

const PROTECTED_PATHS = ["/dashboard", "/activity", "/connections", "/tasks", "/costs"];

export async function middleware(request: NextRequest) {
  if (!auth0) {
    return NextResponse.next();
  }

  // Check if the request is for a protected page and redirect
  // unauthenticated users to login before any Server Components render.
  // This avoids NEXT_REDIRECT errors being caught by the error boundary
  // when redirecting from inside a Server Component nested in a Client boundary.
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED_PATHS.some(
    (path) => pathname === path || pathname.startsWith(path + "/")
  );

  if (isProtected) {
    const session = await auth0.getSession(request);
    if (!session) {
      const loginUrl = new URL("/auth/login", request.url);
      loginUrl.searchParams.set("returnTo", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return auth0.middleware(request);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)",
  ],
};
