import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth/client";
import { isAuth0Configured } from "@/lib/auth/config";
import { SetupBanner } from "@/components/ui/setup-banner";

export const dynamic = "force-dynamic";

export default async function Home() {
  const session = await getSession();

  if (session) {
    redirect("/dashboard");
  }

  return (
    <main className="authrix-grid flex min-h-screen flex-col overflow-hidden px-6 py-8 text-foreground md:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10">
        <header className="flex items-center justify-between">
          <div>
            <p className="authrix-kicker text-accent">Secure agent ops</p>
            <h1 className="authrix-display mt-2 text-4xl font-medium md:text-5xl">
              Authrix
            </h1>
          </div>
          <div className="rounded-full border border-line bg-surface px-4 py-2 text-sm text-muted">
            Hackathon MVP
          </div>
        </header>

        <section className="grid gap-8 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="authrix-card rounded-[2rem] px-8 py-10">
            <p className="authrix-kicker text-accent">Permissioned AI dashboard</p>
            <h2 className="authrix-display mt-5 max-w-3xl text-5xl leading-[1.05] font-medium text-foreground md:text-6xl">
              Real engineering context, narrow agents, explicit execution.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-muted">
              Authrix ingests GitHub activity, turns it into weekly engineering
              summaries, suggests follow-up work, flags spend and delivery risk,
              and stops every write action behind an approval gate.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              {isAuth0Configured() ? (
                <a
                  href="/auth/login"
                  className="rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background transition-transform hover:-translate-y-0.5"
                >
                  Log in with Auth0
                </a>
              ) : (
                <div className="rounded-full bg-foreground px-6 py-3 text-sm font-semibold text-background">
                  Configure Auth0 to log in
                </div>
              )}
              <Link
                href="https://github.com/shuknuk/authrix"
                className="rounded-full border border-line px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-accent-soft"
              >
                View repository
              </Link>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="authrix-card-soft rounded-[1.5rem] p-6">
              <p className="authrix-kicker text-accent">Demo flow</p>
              <ul className="mt-4 space-y-3 text-sm leading-6 text-muted">
                <li>1. Authenticate with Auth0</li>
                <li>2. Connect GitHub through the backend</li>
                <li>3. Normalize activity into typed records</li>
                <li>4. Run engineer, task, and devops agents</li>
                <li>5. Approval-gate every write action</li>
              </ul>
            </div>
            <div className="authrix-card-soft rounded-[1.5rem] p-6">
              <p className="authrix-kicker text-accent">Security model</p>
              <p className="mt-4 text-sm leading-6 text-muted">
                Agents never hold GitHub or Auth0 credentials. External actions
                stay in server-side route handlers, and the task agent only sees
                summary output instead of raw activity.
              </p>
            </div>
          </div>
        </section>

        {!isAuth0Configured() ? (
          <SetupBanner
            title="Auth0 is not configured yet"
            description="Add the Auth0 environment variables from .env.example to enable protected routes and the live login flow."
            items={[
              "AUTH0_DOMAIN",
              "AUTH0_CLIENT_ID",
              "AUTH0_CLIENT_SECRET",
              "AUTH0_SECRET",
            ]}
          />
        ) : null}
      </div>
    </main>
  );
}
