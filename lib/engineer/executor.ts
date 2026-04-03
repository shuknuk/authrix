import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createLiveApprovalRequest } from "@/lib/data/workspace";
import {
  generateEngineerEditProposal,
  type EngineerEditableFile,
} from "@/lib/engineer/model";
import {
  createEngineerExecutionRecord,
  updateEngineerExecutionRecord,
} from "@/lib/engineer/store";
import {
  createEngineerCommit,
  ensureEngineerRepoBinding,
  listRepositoryFiles,
  readWorkingTreeStatus,
  runEngineerCheck,
} from "@/lib/engineer/workspace";
import type { EngineerCheckResult, EngineerExecutionRecord } from "@/types/engineer";

const MAX_EDITABLE_FILES = 6;
const MAX_FILE_BYTES = 16_000;

export async function executeEngineerAutonomyRun(input: {
  sessionId: string;
  runId: string;
  request: string;
  requestedRepository?: string | null;
}): Promise<{
  outputSummary: string;
  execution: EngineerExecutionRecord;
  metadata: Record<string, unknown>;
}> {
  const repoBinding = await ensureEngineerRepoBinding({
    sessionId: input.sessionId,
    requestedRepository: input.requestedRepository,
  });
  const executionId = `engineer_exec_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const createdAt = new Date().toISOString();
  const initialRecord = await createEngineerExecutionRecord({
    id: executionId,
    sessionId: input.sessionId,
    runId: input.runId,
    request: input.request,
    status: "failed",
    createdAt,
    repository: repoBinding.repository,
    sourceRepoPath: repoBinding.sourceRepoPath,
    workspaceDir: repoBinding.workspaceDir,
    baseBranch: repoBinding.baseBranch,
    branchName: repoBinding.branchName,
    plan: [],
    changedFiles: [],
    checks: [],
    metadata: {
      repositorySource: repoBinding.source,
    },
  });

  try {
    const repoFiles = await listRepositoryFiles(repoBinding.workspaceDir);
    const selectedPaths = selectRelevantFiles(input.request, repoFiles);
    const editableFiles = await loadEditableFiles(repoBinding.workspaceDir, selectedPaths);
    if (editableFiles.length === 0) {
      throw new Error(
        "Authrix Engineer could not find editable repo files for this request. Provide a more specific file or subsystem."
      );
    }

    const packageScripts = await readPackageScripts(repoBinding.workspaceDir);
    const firstProposal = await generateEngineerEditProposal({
      repository: repoBinding.repository,
      request: input.request,
      files: editableFiles,
      packageScripts,
    });

    if (firstProposal.needsClarification || firstProposal.edits.length === 0) {
      const question =
        firstProposal.clarifyingQuestion ??
        "Which file, component, or subsystem should Engineer change?";
      const outputSummary = `Need clarification before editing ${repoBinding.repository}: ${question}`;
      const execution = await updateEngineerExecutionRecord(initialRecord.id, {
        status: "needs_clarification",
        plan: firstProposal.plan,
        clarificationQuestion: question,
        outputSummary,
      });

      return {
        outputSummary,
        execution: execution ?? initialRecord,
        metadata: {
          engineerExecutionId: initialRecord.id,
          engineerStatus: "needs_clarification",
          repository: repoBinding.repository,
          branchName: repoBinding.branchName,
          needsClarification: true,
        },
      };
    }

    await applyEdits(repoBinding.workspaceDir, firstProposal.edits);
    let checks = await runDefaultChecks(repoBinding.workspaceDir);
    let activeProposal = firstProposal;

    if (checks.some((check) => check.status === "failed")) {
      const retryFiles = await loadEditableFiles(
        repoBinding.workspaceDir,
        editableFiles.map((file) => file.path)
      );
      const retryProposal = await generateEngineerEditProposal({
        repository: repoBinding.repository,
        request: input.request,
        files: retryFiles,
        packageScripts,
        failedChecks: checks
          .filter((check) => check.status === "failed")
          .map((check) => `${check.name}: ${check.outputSummary ?? "failed"}`),
      });

      if (retryProposal.edits.length > 0) {
        await applyEdits(repoBinding.workspaceDir, retryProposal.edits);
        checks = await runDefaultChecks(repoBinding.workspaceDir);
        activeProposal = retryProposal;
      }
    }

    const { changedFiles, diffSummary } = await readWorkingTreeStatus(repoBinding.workspaceDir);
    if (changedFiles.length === 0) {
      throw new Error(
        "Authrix Engineer did not produce any working tree changes for this request."
      );
    }
    const hasFailedChecks = checks.some((check) => check.status === "failed");

    const commitMessage =
      activeProposal.commitMessage?.trim() ||
      buildDefaultCommitMessage(input.request);
    const commitSha = await createEngineerCommit({
      repoPath: repoBinding.workspaceDir,
      message: commitMessage,
    });

    const approvalBundle = await createLiveApprovalRequest({
      actionKind: "github.pull_request.create",
      title:
        activeProposal.prTitle?.trim() ||
        buildDefaultPrTitle(input.request),
      description:
        activeProposal.prBody?.trim() ||
        buildDefaultPrBody({
          request: input.request,
          repository: repoBinding.repository,
          branchName: repoBinding.branchName,
          diffSummary,
          checks,
      }),
      sourceAgent: "engineer",
      affectedSystem: "GitHub",
      riskLevel: hasFailedChecks ? "high" : "medium",
      relatedRecordIds: [initialRecord.id, input.runId],
      metadata: {
        engineerExecutionId: initialRecord.id,
        repository: repoBinding.repository,
        sourceRepoPath: repoBinding.sourceRepoPath,
        workspaceDir: repoBinding.workspaceDir,
        branchName: repoBinding.branchName,
        baseBranch: repoBinding.baseBranch,
        commitSha,
        commitMessage,
        changedFiles,
        diffSummary,
      },
    });

    const outputSummary = buildCompletedSummary({
      repository: repoBinding.repository,
      branchName: repoBinding.branchName,
      changedFiles,
      checks,
      approvalId: approvalBundle?.approval.id,
      summary:
        activeProposal.summary ??
        `Prepared local engineer changes in ${repoBinding.repository}.`,
    });
    const executionStatus = hasFailedChecks ? "failed" : "completed";

    const execution = await updateEngineerExecutionRecord(initialRecord.id, {
      status: executionStatus,
      plan: activeProposal.plan,
      changedFiles,
      diffSummary,
      commitMessage,
      commitSha: commitSha ?? undefined,
      prTitle:
        activeProposal.prTitle?.trim() || buildDefaultPrTitle(input.request),
      prBody:
        activeProposal.prBody?.trim() ||
        buildDefaultPrBody({
          request: input.request,
          repository: repoBinding.repository,
          branchName: repoBinding.branchName,
          diffSummary,
          checks,
        }),
      checks,
      approvalRequestId: approvalBundle?.approval.id,
      outputSummary,
      error: checks.some((check) => check.status === "failed")
        ? checks
            .filter((check) => check.status === "failed")
            .map((check) => `${check.name}: ${check.outputSummary}`)
            .join(" | ")
        : undefined,
    });

    return {
      outputSummary,
      execution: execution ?? initialRecord,
      metadata: {
        engineerExecutionId: initialRecord.id,
        engineerStatus: executionStatus,
        repository: repoBinding.repository,
        branchName: repoBinding.branchName,
        changedFiles,
        checkStatuses: checks.map((check) => ({
          name: check.name,
          status: check.status,
        })),
        approvalRequestId: approvalBundle?.approval.id,
      },
    };
  } catch (error) {
    const outputSummary = error instanceof Error ? error.message : "Unknown engineer execution error.";
    const execution = await updateEngineerExecutionRecord(initialRecord.id, {
      status: "failed",
      outputSummary,
      error: outputSummary,
    });

    return {
      outputSummary,
      execution: execution ?? initialRecord,
      metadata: {
        engineerExecutionId: initialRecord.id,
        engineerStatus: "failed",
        repository: repoBinding.repository,
        branchName: repoBinding.branchName,
      },
    };
  }
}

async function loadEditableFiles(
  repoPath: string,
  filePaths: string[]
): Promise<EngineerEditableFile[]> {
  const files: EngineerEditableFile[] = [];

  for (const relativePath of filePaths.slice(0, MAX_EDITABLE_FILES)) {
    const absolutePath = path.resolve(repoPath, relativePath);
    if (!absolutePath.startsWith(path.resolve(repoPath))) {
      continue;
    }

    try {
      const content = await readFile(absolutePath, "utf8");
      if (Buffer.byteLength(content, "utf8") > MAX_FILE_BYTES) {
        continue;
      }

      files.push({
        path: relativePath,
        content,
      });
    } catch {
      // Skip unreadable or binary files.
    }
  }

  return files;
}

async function applyEdits(
  repoPath: string,
  edits: Array<{ path: string; content: string }>
): Promise<void> {
  for (const edit of edits) {
    const absolutePath = path.resolve(repoPath, edit.path);
    if (!absolutePath.startsWith(path.resolve(repoPath))) {
      throw new Error(`Authrix Engineer rejected an edit outside the workspace: ${edit.path}`);
    }

    await writeFile(absolutePath, edit.content, "utf8");
  }
}

async function runDefaultChecks(repoPath: string): Promise<EngineerCheckResult[]> {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
  const npxCommand = process.platform === "win32" ? "npx.cmd" : "npx";

  return [
    await runEngineerCheck({
      name: "typecheck",
      cwd: repoPath,
      command: npxCommand,
      args: ["tsc", "--noEmit"],
    }),
    await runEngineerCheck({
      name: "build",
      cwd: repoPath,
      command: npmCommand,
      args: ["run", "build"],
    }),
  ];
}

function selectRelevantFiles(request: string, files: string[]): string[] {
  const text = request.toLowerCase();
  const ranked = files
    .filter(isTextEditablePath)
    .map((filePath) => ({
      filePath,
      score: scoreFilePath(text, filePath),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.filePath.localeCompare(right.filePath))
    .slice(0, MAX_EDITABLE_FILES)
    .map((entry) => entry.filePath);

  if (ranked.length > 0) {
    return ranked;
  }

  return files.filter(isTextEditablePath).slice(0, MAX_EDITABLE_FILES);
}

function scoreFilePath(request: string, filePath: string): number {
  let score = 0;
  const normalizedPath = filePath.toLowerCase();
  const tokens = request
    .split(/[^a-z0-9._/-]+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 3);

  for (const token of tokens) {
    if (normalizedPath.includes(token)) {
      score += 4;
    }
  }

  if (matchesAny(request, ["auth", "login", "session", "middleware"])) {
    if (matchesAny(normalizedPath, ["auth", "middleware", "session", "login"])) {
      score += 10;
    }
  }

  if (matchesAny(request, ["logo", "brand", "icon"])) {
    if (matchesAny(normalizedPath, ["logo", "brand", "icon", "app/", "components/"])) {
      score += 10;
    }
  }

  if (matchesAny(request, ["backend", "api", "route", "server"])) {
    if (matchesAny(normalizedPath, ["app/api", "lib/", "route.ts", "server"])) {
      score += 8;
    }
  }

  if (matchesAny(request, ["frontend", "ui", "page", "dashboard"])) {
    if (matchesAny(normalizedPath, ["app/", "components/", "page.tsx"])) {
      score += 8;
    }
  }

  if (normalizedPath.endsWith("package.json") || normalizedPath.endsWith("tsconfig.json")) {
    score += 1;
  }

  return score;
}

function isTextEditablePath(filePath: string): boolean {
  return /\.(ts|tsx|js|jsx|json|md|css|txt)$/i.test(filePath);
}

function matchesAny(input: string, patterns: string[]): boolean {
  return patterns.some((pattern) => input.includes(pattern));
}

async function readPackageScripts(repoPath: string): Promise<string[]> {
  try {
    const raw = await readFile(path.join(repoPath, "package.json"), "utf8");
    const parsed = JSON.parse(raw) as {
      scripts?: Record<string, string>;
    };

    return Object.keys(parsed.scripts ?? {});
  } catch {
    return [];
  }
}

function buildDefaultCommitMessage(request: string): string {
  const clipped = request.trim().replace(/\s+/g, " ");
  return clipped.length > 68
    ? `authrix: ${clipped.slice(0, 60)}...`
    : `authrix: ${clipped}`;
}

function buildDefaultPrTitle(request: string): string {
  const clipped = request.trim().replace(/\s+/g, " ");
  return clipped.length > 72 ? clipped.slice(0, 69) + "..." : clipped;
}

function buildDefaultPrBody(input: {
  request: string;
  repository: string;
  branchName: string;
  diffSummary: string;
  checks: EngineerCheckResult[];
}): string {
  return [
    `Engineer request: ${input.request}`,
    "",
    `Repository: ${input.repository}`,
    `Branch: ${input.branchName}`,
    "",
    "Validation:",
    ...input.checks.map(
      (check) =>
        `- ${check.name}: ${check.status}${check.outputSummary ? ` (${truncate(check.outputSummary, 160)})` : ""}`
    ),
    "",
    "Diff summary:",
    input.diffSummary || "Working tree changes prepared locally.",
  ].join("\n");
}

function buildCompletedSummary(input: {
  repository: string;
  branchName: string;
  changedFiles: string[];
  checks: EngineerCheckResult[];
  approvalId?: string;
  summary: string;
}): string {
  const checkSummary = input.checks
    .map((check) => `${check.name}:${check.status}`)
    .join(", ");
  const fileSummary =
    input.changedFiles.length > 0
      ? input.changedFiles.slice(0, 6).join(", ")
      : "no changed files recorded";

  return [
    input.summary,
    `Repository ${input.repository} is prepared on branch ${input.branchName}.`,
    `Changed files: ${fileSummary}.`,
    `Checks: ${checkSummary}.`,
    input.approvalId
      ? `Draft PR approval queued as ${input.approvalId}.`
      : "No draft PR approval request was created.",
  ].join(" ");
}

function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;
}
