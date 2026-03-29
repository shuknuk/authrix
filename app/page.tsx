import { redirect } from "next/navigation";
import { getOptionalSession } from "@/lib/auth/session";
import { isAuthConfigured } from "@/lib/auth/auth0";

export default async function Home() {
  const session = await getOptionalSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-[70vh] items-center justify-center">
      <div className="w-full max-w-3xl rounded-[2rem] border border-zinc-800 bg-zinc-900/80 p-8 shadow-[0_24px_60px_rgba(0,0,0,0.28)] md:p-12">
        <p className="text-xs font-medium uppercase tracking-[0.3em] text-zinc-500">
          Authrix
        </p>
        <h1 className="mt-4 text-4xl font-semibold tracking-tight text-zinc-50 md:text-5xl">
          Secure autonomous operations for startup teams
        </h1>
        <p className="mt-5 max-w-2xl text-base leading-8 text-zinc-400">
          Authrix turns engineering activity, approvals, and operational signals
          into a live control tower. Sign in to set up the workspace and access
          the first product shell.
        </p>

        <div className="mt-8 flex flex-wrap gap-3">
          {isAuthConfigured ? (
            <a
              href="/auth/login?returnTo=/dashboard"
              className="inline-flex rounded-full bg-zinc-100 px-5 py-3 text-sm font-medium text-zinc-950 transition hover:bg-white"
            >
              Sign in with Auth0
            </a>
          ) : (
            <div className="rounded-2xl border border-amber-800/40 bg-amber-900/10 px-5 py-4 text-sm text-amber-200">
              Auth0 is not configured yet. Add your tenant values to `.env.local`
              using `.env.example`, then restart the app.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
