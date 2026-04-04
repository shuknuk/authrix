import { CardShell } from "@/components/ui/card-shell";
import type { SlackBriefingRecord, SlackBriefingSchedule } from "@/types/messaging";

interface ScheduledBriefingsCardProps {
  schedules: SlackBriefingSchedule[];
  briefings: SlackBriefingRecord[];
}

export function ScheduledBriefingsCard({
  schedules,
  briefings,
}: ScheduledBriefingsCardProps) {
  return (
    <CardShell
      title="Scheduled Briefings"
      description="Authrix can proactively package engineering, approvals, workflow drift, and ops health into Slack-bound updates."
    >
      <div className="space-y-4">
        {schedules.length > 0 ? (
          schedules.slice(0, 3).map((schedule) => {
            const latestBriefing = briefings.find((item) => item.scheduleId === schedule.id);

            return (
              <div
                key={schedule.id}
                className="rounded-[1.35rem] border border-white/10 bg-white/5 px-4 py-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-[#4D7EA8]/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] text-[#DCE9F5]">
                    {schedule.cadence}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[10px] uppercase tracking-[0.18em] ${
                      schedule.status === "active"
                        ? "bg-[#6E9F78]/10 text-[#DCE9DF]"
                        : "bg-zinc-800 text-zinc-400"
                    }`}
                  >
                    {schedule.status}
                  </span>
                </div>
                <p className="mt-3 text-sm font-medium text-zinc-100">{schedule.title}</p>
                <p className="mt-1 text-xs leading-5 text-slate-400">
                  Audience: {schedule.audienceLabel}
                  {schedule.targetChannelId ? ` · Channel ${schedule.targetChannelId}` : ""}
                </p>
                <p className="mt-2 text-[11px] text-zinc-500">
                  Next run{" "}
                  {schedule.nextRunAt
                    ? new Date(schedule.nextRunAt).toLocaleString()
                    : "not scheduled yet"}
                </p>
                {latestBriefing ? (
                  <p className="mt-2 text-[11px] text-zinc-500">
                    Latest run: {latestBriefing.deliveryStatus} at{" "}
                    {new Date(
                      latestBriefing.deliveredAt ?? latestBriefing.createdAt
                    ).toLocaleString()}
                  </p>
                ) : null}
              </div>
            );
          })
        ) : (
          <div className="rounded-[1.35rem] border border-dashed border-white/10 bg-white/[0.03] px-4 py-6">
            <p className="text-sm text-zinc-200">No scheduled briefings yet.</p>
          </div>
        )}
      </div>
    </CardShell>
  );
}
