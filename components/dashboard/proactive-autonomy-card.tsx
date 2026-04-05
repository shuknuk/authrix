import { CardShell } from "@/components/ui/card-shell";
import type { WorkspaceMemoryRecord } from "@/types/domain";
import type { SlackBriefingRecord, SlackBriefingSchedule } from "@/types/messaging";
import type { JobStatus, RuntimeSessionRecord } from "@/types/runtime";

interface ProactiveAutonomyCardProps {
  jobs: JobStatus[];
  schedules: SlackBriefingSchedule[];
  briefings: SlackBriefingRecord[];
  sessions: RuntimeSessionRecord[];
  memories: WorkspaceMemoryRecord[];
}

export function ProactiveAutonomyCard({
  jobs,
  schedules,
  briefings,
  sessions,
  memories,
}: ProactiveAutonomyCardProps) {
  const activeSchedules = schedules.filter((schedule) => schedule.status === "active").length;
  const deliveredBriefings = briefings.filter((briefing) => briefing.deliveryStatus === "delivered").length;
  const resumableSessions = sessions.filter(isResumableSession).length;
  const latestJob = jobs[0];

  return (
    <CardShell
      title="Proactive Autonomy"
      description="Authrix now keeps continuity across days through shared memory, resumable sessions, scheduled digests, and background follow-up review jobs."
    >
      <div className="grid grid-cols-2 gap-3">
        <Metric label="Shared memory" value={String(memories.length)} />
        <Metric label="Resumable sessions" value={String(resumableSessions)} />
        <Metric label="Active digests" value={String(activeSchedules)} />
        <Metric label="Delivered briefings" value={String(deliveredBriefings)} />
      </div>
      {latestJob ? (
        <div className="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-3">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-zinc-200">Latest background review</p>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] uppercase tracking-[0.16em] ${
                latestJob.state === "completed"
                  ? "bg-green-900/30 text-green-300"
                  : latestJob.state === "failed"
                    ? "bg-red-900/30 text-red-300"
                    : "bg-amber-900/30 text-amber-300"
              }`}
            >
              {latestJob.state}
            </span>
          </div>
          <p className="mt-2 text-xs leading-5 text-zinc-300">{readJobLabel(latestJob)}</p>
          <p className="mt-2 text-[11px] text-zinc-500">Created {formatTimestamp(latestJob.createdAt)}</p>
        </div>
      ) : null}
    </CardShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/60 px-4 py-4">
      <p className="text-[11px] uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-zinc-100">{value}</p>
    </div>
  );
}

function isResumableSession(session: RuntimeSessionRecord): boolean {
  return session.metadata.resumable === true || session.state === "active" || Boolean(session.lastError);
}

function readJobLabel(job: JobStatus): string {
  const resultType =
    job.result && typeof job.result === "object" && job.result !== null && "type" in job.result
      ? String((job.result as { type?: unknown }).type ?? "job")
      : "job";

  if (resultType === "workspace.proactive.review") {
    return "Compacted session memory, refreshed the workspace snapshot, and checked follow-through posture.";
  }

  if (resultType === "workflow.followup.run") {
    return "Scanned workflow follow-up records for reminders and stale work.";
  }

  if (resultType === "slack.briefing.run") {
    return "Generated or delivered a proactive Slack briefing.";
  }

  return "Refreshed Authrix background state.";
}

function formatTimestamp(value: string): string {
  return new Date(value).toLocaleString();
}
