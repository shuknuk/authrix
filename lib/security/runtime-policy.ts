import type { RuntimeToolPolicyStatus } from "@/types/security";

const HOST_LEVEL_PATTERNS = [
  "exec",
  "shell",
  "system.run",
  "node.invoke",
  "apply_patch",
  "filesystem.write",
  "file.write",
  "remove-item",
  "move-item",
];

export interface RuntimeToolEvaluation {
  allowedTools: string[];
  blockedTools: Array<{ tool: string; reason: string }>;
}

export function getRuntimeToolPolicy(): RuntimeToolPolicyStatus {
  const allowedTools = readCsvEnv("AUTHRIX_RUNTIME_ALLOWED_TOOLS");
  const blockedTools = readCsvEnv("AUTHRIX_RUNTIME_BLOCKED_TOOLS");
  const hostLevelToolsAllowed = readBooleanEnv("AUTHRIX_RUNTIME_ALLOW_HOST_TOOLS") ?? false;

  return {
    allowedTools,
    blockedTools,
    hostLevelToolsAllowed,
    mode:
      allowedTools.length > 0
        ? "allowlist"
        : hostLevelToolsAllowed
          ? "mixed"
          : "default-deny-host",
  };
}

export function evaluateRuntimeRequestedTools(
  tools: string[] | undefined
): RuntimeToolEvaluation {
  const normalizedTools = Array.from(
    new Set(
      (tools ?? [])
        .map((tool) => tool.trim())
        .filter(Boolean)
    )
  );
  const policy = getRuntimeToolPolicy();
  const blockedTools: RuntimeToolEvaluation["blockedTools"] = [];
  const allowedTools: string[] = [];

  for (const tool of normalizedTools) {
    if (policy.blockedTools.includes(tool)) {
      blockedTools.push({
        tool,
        reason: "explicitly blocked by runtime policy",
      });
      continue;
    }

    if (policy.allowedTools.length > 0 && !policy.allowedTools.includes(tool)) {
      blockedTools.push({
        tool,
        reason: "not present in the runtime allowlist",
      });
      continue;
    }

    if (!policy.hostLevelToolsAllowed && isHostLevelTool(tool)) {
      blockedTools.push({
        tool,
        reason: "host-level tools are blocked by default",
      });
      continue;
    }

    allowedTools.push(tool);
  }

  return {
    allowedTools,
    blockedTools,
  };
}

function isHostLevelTool(tool: string): boolean {
  const normalized = tool.trim().toLowerCase();
  return HOST_LEVEL_PATTERNS.some((pattern) => normalized.includes(pattern));
}

function readBooleanEnv(name: string): boolean | undefined {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) {
    return undefined;
  }

  if (["1", "true", "yes", "on"].includes(raw)) {
    return true;
  }

  if (["0", "false", "no", "off"].includes(raw)) {
    return false;
  }

  return undefined;
}

function readCsvEnv(name: string): string[] {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return [];
  }

  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}
