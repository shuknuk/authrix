import { mkdir, readFile, writeFile } from "node:fs/promises";
import { refreshWorkspaceSnapshot } from "@/lib/data/workspace";
import { AUTHRIX_DATA_DIR, resolveAuthrixDataPath } from "@/lib/security/paths";
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
