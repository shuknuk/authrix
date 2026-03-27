import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { getGitHubActivityFeed } from "@/lib/github/service";
import { formatDateTime } from "@/lib/utils";

export default async function ActivityPage() {
  const activity = await getGitHubActivityFeed();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Activity"
        title="Normalized engineering feed"
        description="The raw GitHub response is transformed into narrow typed records before any agent sees it."
        aside={
          <StatusBadge tone={activity.source === "github" ? "success" : "warning"}>
            {activity.source === "github" ? "Live data" : "Mock fallback"}
          </StatusBadge>
        }
      />

      <section className="grid gap-5 lg:grid-cols-3">
        <article className="authrix-card rounded-[1.6rem] p-6">
          <p className="authrix-kicker text-accent">Feed status</p>
          <h2 className="mt-4 text-3xl font-semibold text-foreground">
            {activity.activities.length}
          </h2>
          <p className="mt-2 text-sm text-muted">Normalized activity records</p>
        </article>
        <article className="authrix-card rounded-[1.6rem] p-6">
          <p className="authrix-kicker text-accent">Connection</p>
          <h2 className="mt-4 text-3xl font-semibold text-foreground">
            {activity.connected ? "Connected" : "Fallback"}
          </h2>
          <p className="mt-2 text-sm text-muted">
            Fetched {formatDateTime(activity.fetchedAt)}
          </p>
        </article>
        <article className="authrix-card rounded-[1.6rem] p-6">
          <p className="authrix-kicker text-accent">Security note</p>
          <p className="mt-4 text-sm leading-7 text-muted">
            The engineer agent receives only these normalized records, not the
            raw OAuth token or full GitHub API response.
          </p>
        </article>
      </section>

      <section className="space-y-3">
        {activity.activities.map((item) => (
          <article key={item.id} className="authrix-card rounded-[1.4rem] p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge tone="neutral">{item.kind}</StatusBadge>
                  <StatusBadge tone={item.source === "github" ? "success" : "warning"}>
                    {item.source}
                  </StatusBadge>
                </div>
                <h2 className="mt-3 text-xl font-semibold text-foreground">
                  {item.title}
                </h2>
                <p className="mt-2 text-sm leading-7 text-muted">{item.summary}</p>
              </div>
              <div className="text-sm text-muted md:text-right">
                <p>{item.repo}</p>
                <p className="mt-1">{item.actor}</p>
                <p className="mt-1">{formatDateTime(item.occurredAt)}</p>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}
