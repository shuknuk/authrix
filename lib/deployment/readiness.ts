import { mkdir, unlink, writeFile } from "node:fs/promises";
import { isAuthConfigured } from "@/lib/auth/auth0";
import {
  getGitHubConnectionName,
  isTokenVaultConfigured,
} from "@/lib/auth/token-vault";
import { listWorkspaceJobs } from "@/lib/data/jobs";
import { getWorkspaceSnapshot } from "@/lib/data/workspace";
import { getRuntimeBridge } from "@/lib/runtime/bridge";
import { resolveRuntimeProvider } from "@/lib/runtime/config";
import {
  areExternalWritesEnabled,
  getAuthrixDeploymentMode,
} from "@/lib/security/config";
import { AUTHRIX_DATA_DIR, resolveAuthrixDataPath } from "@/lib/security/paths";
import { getSecurityPosture } from "@/lib/security/status";
import type {
  DeploymentCheck,
  DeploymentChecklistItem,
  DeploymentReadinessReport,
  DeploymentSmokeReport,
  DeploymentSmokeStatus,
  DeploymentSmokeTest,
  DeploymentStatus,
} from "@/types/deployment";

export async function getDeploymentReadinessReport(): Promise<DeploymentReadinessReport> {
  const checkedAt = new Date().toISOString();
  const deploymentMode = getAuthrixDeploymentMode();
  const runtimeProvider = resolveRuntimeProvider();
  const securityPosture = getSecurityPosture();
  const externalWritesEnabled = areExternalWritesEnabled();
  const githubTargetConfigured = Boolean(
    process.env.GITHUB_OWNER?.trim() && process.env.GITHUB_REPO?.trim()
  );
  const [runtimeStatus, snapshot, jobs, dataDirectoryWritable] = await Promise.all([
    getRuntimeBridge().getStatus(),
    getWorkspaceSnapshot(),
    listWorkspaceJobs(1),
    checkDataDirectoryWritable(),
  ]);

  const githubIntegration =
    snapshot.integrations.find((integration) => integration.service === "GitHub") ?? null;
  const latestJob = jobs[0];

  const checks: DeploymentCheck[] = [
    {
      id: "worker-box-mode",
      label: "Dedicated worker-box mode",
      status: deploymentMode === "worker-box" ? "ready" : "warning",
      message:
        deploymentMode === "worker-box"
          ? "Authrix is configured for the preferred dedicated worker-machine deployment boundary."
          : "Authrix is still running in local-dev mode. Switch AUTHRIX_DEPLOYMENT_MODE=worker-box before serious deployment.",
    },
    {
      id: "auth0-core",
      label: "Auth0 login boundary",
      status: isAuthConfigured ? "ready" : "blocked",
      message: isAuthConfigured
        ? "Auth0 login configuration is present for the control tower."
        : "Auth0 is not fully configured yet, so the primary secure login path is incomplete.",
    },
    {
      id: "github-target",
      label: "GitHub repository target",
      status: githubTargetConfigured ? "ready" : "blocked",
      message: githubTargetConfigured
        ? `GitHub ingestion target is configured for ${process.env.GITHUB_OWNER}/${process.env.GITHUB_REPO}.`
        : "Set GITHUB_OWNER and GITHUB_REPO so Authrix knows which engineering activity to ingest.",
    },
    {
      id: "github-delegated-access",
      label: "GitHub delegated access",
      status:
        githubIntegration?.connected && githubIntegration.mode === "token-vault"
          ? "ready"
          : "warning",
      message:
        githubIntegration?.connected && githubIntegration.mode === "token-vault"
          ? "Delegated GitHub access is active through Auth0 Connected Accounts / Token Vault."
          : isTokenVaultConfigured
            ? `Token Vault is configured for ${getGitHubConnectionName()}. Sign into Authrix and connect GitHub from the Connections page to finish onboarding.`
            : "Token Vault GitHub connection is not fully configured yet. Authrix can still use honest fallbacks, but the preferred secure path is incomplete.",
    },
    {
      id: "runtime-readiness",
      label: "Internal runtime readiness",
      status:
        runtimeStatus.mode === "live"
          ? "ready"
          : runtimeProvider === "openclaw"
            ? "blocked"
            : "warning",
      message:
        runtimeStatus.mode === "live"
          ? "The internal runtime is reachable and responding."
          : runtimeProvider === "openclaw"
            ? "OpenClaw-derived runtime mode is selected, but the runtime is not healthy yet."
            : "Authrix is still using the mock runtime. This is acceptable for development, but not the preferred worker-box posture.",
    },
    {
      id: "data-directory",
      label: "Product data directory",
      status: dataDirectoryWritable ? "ready" : "blocked",
      message: dataDirectoryWritable
        ? `${AUTHRIX_DATA_DIR} is writable for persisted state, jobs, docs, and security events.`
        : `${AUTHRIX_DATA_DIR} is not writable, so Authrix cannot safely persist product state on this machine.`,
    },
    {
      id: "external-write-posture",
      label: "Mediated external writes",
      status:
        externalWritesEnabled && deploymentMode !== "worker-box"
          ? "warning"
          : "ready",
      message: externalWritesEnabled
        ? deploymentMode === "worker-box"
          ? "Approved external writes are enabled inside the preferred worker-box boundary."
          : "Approved external writes are enabled outside the preferred worker-box boundary."
        : "Approved external writes are still blocked by policy, which is the safer default during bring-up.",
    },
  ];

  const checklist: DeploymentChecklistItem[] = [
    {
      id: "set-deployment-mode",
      label: "Switch Authrix into worker-box mode",
      status: deploymentMode === "worker-box" ? "complete" : "pending",
      description:
        "Set AUTHRIX_DEPLOYMENT_MODE=worker-box so the deployment posture matches the intended trust boundary.",
    },
    {
      id: "configure-auth0",
      label: "Configure Auth0 login for the control tower",
      status: isAuthConfigured ? "complete" : "pending",
      description:
        "Fill in AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_SECRET, and APP_BASE_URL for the worker-box environment.",
    },
    {
      id: "configure-github-target",
      label: "Point Authrix at the startup repository",
      status: githubTargetConfigured ? "complete" : "pending",
      description:
        "Set GITHUB_OWNER and GITHUB_REPO so engineering ingestion uses the actual startup workspace.",
    },
    {
      id: "bring-runtime-online",
      label: "Bring the internal runtime online",
      status:
        runtimeStatus.mode === "live"
          ? "complete"
          : runtimeStatus.configured
            ? "in_progress"
            : "pending",
      description:
        "Run the OpenClaw-derived internal runtime and verify it responds through the configured Authrix runtime transport.",
    },
    {
      id: "connect-github",
      label: "Connect GitHub through Auth0",
      status:
        githubIntegration?.connected && githubIntegration.mode === "token-vault"
          ? "complete"
          : isTokenVaultConfigured
            ? "in_progress"
            : "pending",
      description:
        "Sign into Authrix, open Connections, and finish the delegated GitHub connection flow from the control tower.",
    },
    {
      id: "run-first-refresh",
      label: "Run the first persisted refresh",
      status:
        latestJob?.state === "completed"
          ? "complete"
          : latestJob
            ? "in_progress"
            : "pending",
      description:
        "Trigger a workspace refresh job so the worker box has a persisted baseline snapshot and pipeline history.",
    },
    {
      id: "review-posture",
      label: "Review security posture and warnings",
      status:
        securityPosture.warnings.length === 0
          ? "complete"
          : securityPosture.guardrails.some((guardrail) => guardrail.state === "disabled")
            ? "pending"
            : "in_progress",
      description:
        "Inspect Connections and Dashboard for any remaining deployment, runtime, or delegated-access warnings before wider testing.",
    },
  ];

  const nextSteps = [
    ...checks
      .filter((check) => check.status !== "ready")
      .slice(0, 3)
      .map((check) => check.message),
    ...checklist
      .filter((item) => item.status !== "complete")
      .slice(0, 2)
      .map((item) => item.description),
  ];

  return {
    checkedAt,
    deploymentMode,
    overallStatus: summarizeCheckStatuses(checks.map((check) => check.status)),
    checks,
    checklist,
    nextSteps,
  };
}

export async function runDeploymentSmokeTest(): Promise<DeploymentSmokeReport> {
  const checkedAt = new Date().toISOString();
  const tests: DeploymentSmokeTest[] = [];

  const dataDirectoryWritable = await checkDataDirectoryWritable();
  tests.push({
    id: "data-directory",
    label: "Writable persisted state directory",
    status: dataDirectoryWritable ? "passed" : "failed",
    details: dataDirectoryWritable
      ? `${AUTHRIX_DATA_DIR} accepted a write probe successfully.`
      : `${AUTHRIX_DATA_DIR} could not be written to, so persisted product state would fail.`,
  });

  let snapshot: Awaited<ReturnType<typeof getWorkspaceSnapshot>> | null = null;
  try {
    snapshot = await getWorkspaceSnapshot();
    tests.push({
      id: "workspace-snapshot",
      label: "Workspace snapshot loads",
      status: "passed",
      details: `Persisted workspace snapshot loaded with ${snapshot.integrations.length} integrations, ${snapshot.tasks.length} tasks, and ${snapshot.approvalRequests.length} approvals.`,
    });
  } catch (error) {
    tests.push({
      id: "workspace-snapshot",
      label: "Workspace snapshot loads",
      status: "failed",
      details: formatErrorDetails(error, "Workspace snapshot failed to load."),
    });
  }

  try {
    const runtimeStatus = await getRuntimeBridge().getStatus();
    tests.push({
      id: "runtime-status",
      label: "Runtime status responds",
      status:
        runtimeStatus.mode === "live"
          ? "passed"
          : runtimeStatus.provider === "openclaw"
            ? "failed"
            : "warning",
      details:
        runtimeStatus.mode === "live"
          ? runtimeStatus.description
          : runtimeStatus.provider === "openclaw"
            ? "Authrix is configured for the internal runtime, but the runtime is not healthy yet."
            : "Authrix is still using the mock runtime for this environment.",
    });
  } catch (error) {
    tests.push({
      id: "runtime-status",
      label: "Runtime status responds",
      status: "failed",
      details: formatErrorDetails(error, "Runtime status call failed."),
    });
  }

  try {
    const securityPosture = getSecurityPosture();
    tests.push({
      id: "security-posture",
      label: "Security posture evaluates",
      status: securityPosture.warnings.length === 0 ? "passed" : "warning",
      details:
        securityPosture.warnings.length === 0
          ? "Deployment guardrails are aligned with the preferred posture."
          : `${securityPosture.warnings.length} posture warning(s) remain active.`,
    });
  } catch (error) {
    tests.push({
      id: "security-posture",
      label: "Security posture evaluates",
      status: "failed",
      details: formatErrorDetails(error, "Security posture evaluation failed."),
    });
  }

  try {
    const jobs = await listWorkspaceJobs(1);
    tests.push({
      id: "refresh-jobs",
      label: "Refresh job surface loads",
      status: "passed",
      details: jobs[0]
        ? `Latest refresh job is ${jobs[0].state}.`
        : "Refresh job surface loaded successfully. No jobs have been run yet.",
    });
  } catch (error) {
    tests.push({
      id: "refresh-jobs",
      label: "Refresh job surface loads",
      status: "failed",
      details: formatErrorDetails(error, "Workspace job surface failed to load."),
    });
  }

  if (snapshot) {
    const githubIntegration =
      snapshot.integrations.find((integration) => integration.service === "GitHub") ?? null;
    tests.push({
      id: "github-onboarding",
      label: "GitHub onboarding posture",
      status:
        githubIntegration?.connected && githubIntegration.mode === "token-vault"
          ? "passed"
          : "warning",
      details:
        githubIntegration?.connected && githubIntegration.mode === "token-vault"
          ? "Delegated GitHub access is connected through Auth0 and ready for the main product flow."
          : githubIntegration?.description ??
            "GitHub delegated access still needs to be completed from the Connections page.",
    });
  }

  const notes = tests
    .filter((test) => test.status !== "passed")
    .map((test) => `${test.label}: ${test.details}`);

  return {
    checkedAt,
    overallStatus: summarizeSmokeStatuses(tests.map((test) => test.status)),
    tests,
    notes,
  };
}

async function checkDataDirectoryWritable(): Promise<boolean> {
  const probePath = resolveAuthrixDataPath(".deployment-probe.json");

  try {
    await mkdir(AUTHRIX_DATA_DIR, { recursive: true });
    await writeFile(probePath, JSON.stringify({ checkedAt: new Date().toISOString() }), "utf8");
    await unlink(probePath);
    return true;
  } catch {
    return false;
  }
}

function summarizeCheckStatuses(statuses: DeploymentStatus[]): DeploymentStatus {
  if (statuses.includes("blocked")) {
    return "blocked";
  }

  if (statuses.includes("warning")) {
    return "warning";
  }

  return "ready";
}

function summarizeSmokeStatuses(statuses: DeploymentSmokeStatus[]): DeploymentStatus {
  if (statuses.includes("failed")) {
    return "blocked";
  }

  if (statuses.includes("warning")) {
    return "warning";
  }

  return "ready";
}

function formatErrorDetails(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}
