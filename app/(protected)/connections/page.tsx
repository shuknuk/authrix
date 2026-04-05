import { PageHeader } from "@/components/layout/page-header";
import { SetupBanner } from "@/components/ui/setup-banner";
import { StatusBadge } from "@/components/ui/status-badge";
import { getSession } from "@/lib/auth/client";
import { isGitHubConfigured } from "@/lib/auth/config";
import { getConnectionStatus } from "@/lib/github/service";
import { formatDateTime } from "@/lib/utils";

export default async function ConnectionsPage({
  searchParams,
}: {
  searchParams: Promise<{
    connected?: string;
    disconnected?: string;
    error?: string;
  }>;
}) {
  const [session, status, params] = await Promise.all([
    getSession(),
    getConnectionStatus(),
    searchParams,
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Connections"
        title="Credential boundaries"
        description="Auth0 protects the app shell. GitHub is connected separately and kept inside a server-side session so agents never receive raw credentials."
      />

      {params.connected ? (
        <div className="rounded-[1.5rem] bg-[rgba(31,122,90,0.12)] px-5 py-4 text-sm text-success">
          GitHub connected successfully.
        </div>
      ) : null}
      {params.disconnected ? (
        <div className="rounded-[1.5rem] bg-[rgba(183,121,31,0.12)] px-5 py-4 text-sm text-warning">
          GitHub session cleared. Authrix will fall back to mock data until you reconnect.
        </div>
      ) : null}
      {params.error ? (
        <div className="rounded-[1.5rem] bg-[rgba(165,63,63,0.12)] px-5 py-4 text-sm text-danger">
          {params.error.replaceAll("-", " ")}
        </div>
      ) : null}

      {!isGitHubConfigured() ? (
        <SetupBanner
          title="GitHub OAuth is not configured"
          description="Add the GitHub client ID and secret to enable a real connection. Until then the dashboard intentionally uses mock engineering activity."
          items={["GITHUB_CLIENT_ID", "GITHUB_CLIENT_SECRET", "GITHUB_CALLBACK_URL"]}
        />
      ) : null}

      <section className="grid gap-5 lg:grid-cols-2">
        <article className="authrix-card rounded-[1.6rem] p-6">
          <p className="authrix-kicker text-accent">Auth0 session</p>
          <div className="mt-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                {session?.user.name ?? session?.user.nickname ?? "Authenticated user"}
              </h2>
              <p className="mt-2 text-sm text-muted">
                {session?.user.email ?? "No email available from Auth0"}
              </p>
            </div>
            <StatusBadge tone="success">protected</StatusBadge>
          </div>
          <p className="mt-4 text-sm leading-7 text-muted">
            Authrix route protection is enforced through Auth0. Protected pages redirect to `/auth/login` when the session is missing.
          </p>
        </article>

        <article className="authrix-card rounded-[1.6rem] p-6">
          <p className="authrix-kicker text-accent">GitHub connection</p>
          <div className="mt-4 flex items-start justify-between gap-3">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                {status.connected
                  ? status.account?.login ?? "Connected account"
                  : "Not connected"}
              </h2>
              <p className="mt-2 text-sm leading-7 text-muted">{status.message}</p>
            </div>
            <StatusBadge
              tone={
                status.connected
                  ? status.source === "github"
                    ? "success"
                    : "warning"
                  : status.source === "unconfigured"
                    ? "danger"
                    : "warning"
              }
            >
              {status.source}
            </StatusBadge>
          </div>

          <div className="mt-5 flex flex-wrap gap-3 text-sm text-muted">
            {status.scope ? <span>Scope: {status.scope}</span> : null}
            {status.lastSyncAt ? (
              <span>Connected: {formatDateTime(status.lastSyncAt)}</span>
            ) : null}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            {status.connected ? (
              <form action="/api/github/disconnect" method="post">
                <button
                  type="submit"
                  className="rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background"
                >
                  Disconnect GitHub
                </button>
              </form>
            ) : (
              <a
                href="/api/github/connect"
                className="rounded-full bg-foreground px-5 py-3 text-sm font-semibold text-background"
              >
                Connect GitHub
              </a>
            )}
          </div>
        </article>
      </section>
    </div>
  );
}
