import { mkdir, readFile, writeFile } from "node:fs/promises";
import { getWorkspaceSnapshot, refreshWorkspaceSnapshot } from "@/lib/data/workspace";
import { compactRecentRuntimeSessions, countResumableRuntimeSessions } from "@/lib/memory/service";
import { AUTHRIX_DATA_DIR, resolveAuthrixDataPath } from "@/lib/security/paths";
import { runScheduledSlackBriefing } from "@/lib/slack/briefings";
import { syncWorkflowFollowUpRecords } from "@/lib/workflow/follow-up";
import type { JobStatus } from "@/types/runtime";

const DATA_DIR = AUTHRIX_DATA_DIR;
const JOBS_PATH = resolveAuthrixDataPath("jobs.json");

let jobsCache: JobStatus[] | null = null;
let jobsPromise: Promise<JobStatus[]> | null = null;

export async function listWorkspaceJobs(limit = 10): Promise<JobStatus[]> {
  const jobs = await loadJobs();
  return jobs.slice(0, limit).map(cloneJob);
}

export async function getWorkspaceJob(jobId: string): Promise<JobStatus | null> {
  const jobs = await loadJobs();
  const job = jobs.find((entry) => entry.id === jobId);
  return job ? cloneJob(job) : null;
}

export async function submitWorkspaceRefreshJob(): Promise<JobStatus> {
  const createdAt = new Date().toISOString();
  const job: JobStatus = {
    id: `job-refresh-${Date.now()}`,
    state: "queued",
    createdAt,
    result: {
      type: "workspace.refresh",
    },
  };

  const jobs = await loadJobs();
  await saveJobs([job, ...jobs].slice(0, 50));
  void runWorkspaceRefreshJob(job.id);

  return cloneJob(job);
}

export async function submitSlackBriefingJob(scheduleId?: string): Promise<JobStatus> {
  const createdAt = new Date().toISOString();
  const job: JobStatus = {
    id: `job-slack-briefing-${Date.now()}`,
    state: "queued",
    createdAt,
    result: {
      type: "slack.briefing.run",
      scheduleId,
    },
  };

  const jobs = await loadJobs();
  await saveJobs([job, ...jobs].slice(0, 50));
  void runSlackBriefingJob(job.id, scheduleId);

  return cloneJob(job);
}

export async function submitWorkflowFollowUpJob(): Promise<JobStatus> {
  const createdAt = new Date().toISOString();
  const job: JobStatus = {
    id: `job-workflow-followup-${Date.now()}`,
    state: "queued",
    createdAt,
    result: {
      type: "workflow.followup.run",
    },
  };

  const jobs = await loadJobs();
  await saveJobs([job, ...jobs].slice(0, 50));
  void runWorkflowFollowUpJob(job.id);

  return cloneJob(job);
}

export async function submitProactiveReviewJob(): Promise<JobStatus> {
  const createdAt = new Date().toISOString();
  const job: JobStatus = {
    id: `job-proactive-review-${Date.now()}`,
    state: "queued",
    createdAt,
    result: {
      type: "workspace.proactive.review",
    },
  };

  const jobs = await loadJobs();
  await saveJobs([job, ...jobs].slice(0, 50));
  void runProactiveReviewJob(job.id);

  return cloneJob(job);
}

async function runWorkspaceRefreshJob(jobId: string): Promise<void> {
  await updateJob(jobId, (job) => ({
    ...job,
    state: "running",
    startedAt: new Date().toISOString(),
  }));

  try {
    const snapshot = await refreshWorkspaceSnapshot();
    await updateJob(jobId, (job) => ({
      ...job,
      state: "completed",
      completedAt: new Date().toISOString(),
      result: {
        type: "workspace.refresh",
        refreshedAt: snapshot.state.refreshedAt,
        pipelineCount: snapshot.state.pipelines.length,
      },
    }));
  } catch (error) {
    await updateJob(jobId, (job) => ({
      ...job,
      state: "failed",
      completedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown refresh error.",
    }));
  }
}

async function runSlackBriefingJob(jobId: string, scheduleId?: string): Promise<void> {
  await updateJob(jobId, (job) => ({
    ...job,
    state: "running",
    startedAt: new Date().toISOString(),
  }));

  try {
    const briefing = await runScheduledSlackBriefing(scheduleId);
    await updateJob(jobId, (job) => ({
      ...job,
      state: "completed",
      completedAt: new Date().toISOString(),
      result: {
        type: "slack.briefing.run",
        scheduleId: briefing.schedule.id,
        deliveryStatus: briefing.record.deliveryStatus,
        targetChannelId: briefing.record.targetChannelId,
        deliveredAt: briefing.record.deliveredAt,
      },
    }));
  } catch (error) {
    await updateJob(jobId, (job) => ({
      ...job,
      state: "failed",
      completedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown Slack briefing error.",
    }));
  }
}

async function runWorkflowFollowUpJob(jobId: string): Promise<void> {
  await updateJob(jobId, (job) => ({
    ...job,
    state: "running",
    startedAt: new Date().toISOString(),
  }));

  try {
    const snapshot = await getWorkspaceSnapshot();
    const followUpSync = await syncWorkflowFollowUpRecords(snapshot);
    await updateJob(jobId, (job) => ({
      ...job,
      state: "completed",
      completedAt: new Date().toISOString(),
      result: {
        type: "workflow.followup.run",
        reminderCount: followUpSync.openCount,
        overdueCount: followUpSync.overdueCount,
        scannedAt: new Date().toISOString(),
      },
    }));
  } catch (error) {
    await updateJob(jobId, (job) => ({
      ...job,
      state: "failed",
      completedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown workflow follow-up error.",
    }));
  }
}

async function runProactiveReviewJob(jobId: string): Promise<void> {
  await updateJob(jobId, (job) => ({
    ...job,
    state: "running",
    startedAt: new Date().toISOString(),
  }));

  try {
    const compactedSessions = await compactRecentRuntimeSessions(8);
    const snapshot = await refreshWorkspaceSnapshot();
    const followUpSync = await syncWorkflowFollowUpRecords(snapshot);

    await updateJob(jobId, (job) => ({
      ...job,
      state: "completed",
      completedAt: new Date().toISOString(),
      result: {
        type: "workspace.proactive.review",
        memoryCount: snapshot.memories.length,
        handoffCount: snapshot.handoffs.length,
        resumableSessionCount: countResumableRuntimeSessions(compactedSessions),
        reminderCount: followUpSync.openCount,
        overdueCount: followUpSync.overdueCount,
        reviewedAt: new Date().toISOString(),
      },
    }));
  } catch (error) {
    await updateJob(jobId, (job) => ({
      ...job,
      state: "failed",
      completedAt: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown proactive review error.",
    }));
  }
}

async function updateJob(
  jobId: string,
  update: (job: JobStatus) => JobStatus
): Promise<void> {
  const jobs = await loadJobs();
  const nextJobs = jobs.map((job) => (job.id === jobId ? update(job) : job));
  await saveJobs(nextJobs);
}

async function loadJobs(): Promise<JobStatus[]> {
  if (jobsCache) {
    return jobsCache.map(cloneJob);
  }

  if (!jobsPromise) {
    jobsPromise = readJobsFromDisk()
      .then((jobs) => {
        jobsCache = jobs;
        return jobs;
      })
      .finally(() => {
        jobsPromise = null;
      });
  }

  const jobs = await jobsPromise;
  return jobs.map(cloneJob);
}

async function saveJobs(jobs: JobStatus[]): Promise<void> {
  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(JOBS_PATH, JSON.stringify(jobs, null, 2), "utf8");
  jobsCache = jobs.map(cloneJob);
}

async function readJobsFromDisk(): Promise<JobStatus[]> {
  try {
    const raw = await readFile(JOBS_PATH, "utf8");
    return JSON.parse(raw) as JobStatus[];
  } catch (error) {
    if (
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      (error as { code?: string }).code === "ENOENT"
    ) {
      return [];
    }

    throw error;
  }
}

function cloneJob(job: JobStatus): JobStatus {
  return JSON.parse(JSON.stringify(job)) as JobStatus;
}
