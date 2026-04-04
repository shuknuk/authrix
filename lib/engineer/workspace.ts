import { mkdir, stat } from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { resolveAuthrixDataPath } from "@/lib/security/paths";
import type { EngineerCheckResult, EngineerRepoBinding } from "@/types/engineer";

const execFileAsync = promisify(execFile);
const COMMAND_TIMEOUT_MS = 120_000;
const OUTPUT_LIMIT = 24_000;

export async function ensureEngineerRepoBinding(input: {
  sessionId: string;
  requestedRepository?: string | null;
}): Promise<EngineerRepoBinding> {
  const sourceRepoPath = await resolveSourceRepoPath();
  const repository = resolveRepositoryLabel(
    sourceRepoPath,
    input.requestedRepository
  );
  const baseBranch =
    (await readGitOutput(sourceRepoPath, ["rev-parse", "--abbrev-ref", "HEAD"])) || "main";
  const branchName = `authrix-engineer-${input.sessionId.slice(0, 8)}`.toLowerCase();
  const workspaceDir = resolveAuthrixDataPath("engineer-workspaces", input.sessionId);

  if (!(await isExistingGitWorkspace(workspaceDir))) {
    await mkdir(path.dirname(workspaceDir), { recursive: true });
    await runGit(sourceRepoPath, ["worktree", "add", "-B", branchName, workspaceDir, "HEAD"]);
  }

  return {
    repository,
    sourceRepoPath,
    workspaceDir,
    baseBranch,
    branchName,
    source: process.env.AUTHRIX_ENGINEER_LOCAL_REPO_PATH ? "env" : "cwd",
  };
}

export async function listRepositoryFiles(
  repoPath: string
): Promise<string[]> {
  const output = await readGitOutput(repoPath, ["ls-files"]);
  return output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}

export async function runEngineerCheck(input: {
  name: string;
  cwd: string;
  command: string;
  args: string[];
}): Promise<EngineerCheckResult> {
  const commandLabel = [input.command, ...input.args].join(" ");

  try {
    const { stdout, stderr } = await execFileAsync(input.command, input.args, {
      cwd: input.cwd,
      timeout: COMMAND_TIMEOUT_MS,
      windowsHide: true,
      maxBuffer: 1024 * 1024 * 8,
    });

    return {
      name: input.name,
      command: commandLabel,
      status: "passed",
      outputSummary: summarizeCommandOutput(stdout, stderr),
    };
  } catch (error) {
    const details = extractExecFailure(error);
    return {
      name: input.name,
      command: commandLabel,
      status: "failed",
      outputSummary: summarizeCommandOutput(details.stdout, details.stderr),
    };
  }
}

export async function readWorkingTreeStatus(repoPath: string): Promise<{
  changedFiles: string[];
  diffSummary: string;
}> {
  const [changedFilesOutput, diffSummary] = await Promise.all([
    readGitOutput(repoPath, ["diff", "--name-only"]),
    readGitOutput(repoPath, ["diff", "--stat"]),
  ]);

  return {
    changedFiles: changedFilesOutput
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean),
    diffSummary: diffSummary.trim(),
  };
}

export async function createEngineerCommit(input: {
  repoPath: string;
  message: string;
}): Promise<string | null> {
  await runGit(input.repoPath, ["add", "-A"]);

  try {
    await execFileAsync(
      "git",
      [
        "-c",
        "user.name=Authrix",
        "-c",
        "user.email=authrix@local",
        "commit",
        "-m",
        input.message,
      ],
      {
        cwd: input.repoPath,
        timeout: COMMAND_TIMEOUT_MS,
        windowsHide: true,
        maxBuffer: 1024 * 1024 * 8,
      }
    );
  } catch (error) {
    const details = extractExecFailure(error);
    if (
      details.stderr.includes("nothing to commit") ||
      details.stdout.includes("nothing to commit")
    ) {
      return null;
    }

    throw new Error(`Engineer commit failed. ${summarizeCommandOutput(details.stdout, details.stderr)}`);
  }

  const sha = await readGitOutput(input.repoPath, ["rev-parse", "HEAD"]);
  return sha.trim() || null;
}

async function resolveSourceRepoPath(): Promise<string> {
  const configured = process.env.AUTHRIX_ENGINEER_LOCAL_REPO_PATH?.trim();
  const candidate = configured ? path.resolve(configured) : process.cwd();
  const root = await readGitOutput(candidate, ["rev-parse", "--show-toplevel"]).catch(() => "");

  if (!root.trim()) {
    throw new Error(
      "Authrix Engineer could not find a local git repository. Set AUTHRIX_ENGINEER_LOCAL_REPO_PATH to a repo root on the worker box."
    );
  }

  return path.resolve(root.trim());
}

function resolveRepositoryLabel(
  sourceRepoPath: string,
  requestedRepository?: string | null
): string {
  const localRepoName = path.basename(sourceRepoPath);
  const configuredRepository = getConfiguredRepository();
  const requested = requestedRepository?.trim() || null;
  const canonicalRepository = configuredRepository ?? localRepoName;

  if (!requested) {
    return canonicalRepository;
  }

  if (configuredRepository && repositoriesMatch(requested, configuredRepository)) {
    return configuredRepository;
  }

  if (repositoriesMatch(requested, localRepoName)) {
    return configuredRepository ?? requested;
  }

  throw new Error(
    `Authrix Engineer is currently bound to local repo ${canonicalRepository} at ${sourceRepoPath}. Requested repository "${requested}" is not available on this worker box.`
  );
}

function getConfiguredRepository(): string | null {
  const owner = process.env.GITHUB_OWNER?.trim();
  const repo = process.env.GITHUB_REPO?.trim();

  return owner && repo ? `${owner}/${repo}` : null;
}

function repositoriesMatch(left: string, right: string): boolean {
  return normalizeRepository(left) === normalizeRepository(right);
}

function normalizeRepository(value: string): string {
  const trimmed = value.trim().replace(/^https?:\/\/github\.com\//i, "").replace(/\.git$/i, "");
  const parts = trimmed.split("/").filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[parts.length - 2]}/${parts[parts.length - 1]}`.toLowerCase();
  }

  return trimmed.toLowerCase();
}

async function isExistingGitWorkspace(workspaceDir: string): Promise<boolean> {
  try {
    const gitPath = path.join(workspaceDir, ".git");
    const gitStat = await stat(gitPath);
    return gitStat.isFile() || gitStat.isDirectory();
  } catch {
    return false;
  }
}

async function runGit(repoPath: string, args: string[]): Promise<void> {
  try {
    await execFileAsync("git", args, {
      cwd: repoPath,
      timeout: COMMAND_TIMEOUT_MS,
      windowsHide: true,
      maxBuffer: 1024 * 1024 * 8,
    });
  } catch (error) {
    const details = extractExecFailure(error);
    throw new Error(`git ${args.join(" ")} failed. ${summarizeCommandOutput(details.stdout, details.stderr)}`);
  }
}

async function readGitOutput(repoPath: string, args: string[]): Promise<string> {
  try {
    const { stdout } = await execFileAsync("git", args, {
      cwd: repoPath,
      timeout: COMMAND_TIMEOUT_MS,
      windowsHide: true,
      maxBuffer: 1024 * 1024 * 8,
    });

    return stdout.trim();
  } catch (error) {
    const details = extractExecFailure(error);
    throw new Error(`git ${args.join(" ")} failed. ${summarizeCommandOutput(details.stdout, details.stderr)}`);
  }
}

function extractExecFailure(error: unknown): {
  stdout: string;
  stderr: string;
} {
  if (typeof error === "object" && error !== null) {
    const maybe = error as {
      stdout?: string | Buffer;
      stderr?: string | Buffer;
    };

    return {
      stdout: typeof maybe.stdout === "string" ? maybe.stdout : String(maybe.stdout ?? ""),
      stderr: typeof maybe.stderr === "string" ? maybe.stderr : String(maybe.stderr ?? ""),
    };
  }

  return {
    stdout: "",
    stderr: String(error),
  };
}

function summarizeCommandOutput(stdout: string, stderr: string): string {
  const combined = [stdout.trim(), stderr.trim()].filter(Boolean).join("\n").trim();
  if (!combined) {
    return "Completed without additional output.";
  }

  return combined.length > OUTPUT_LIMIT
    ? `${combined.slice(0, OUTPUT_LIMIT - 3)}...`
    : combined;
}
