import { isAuthConfigured } from "@/lib/auth/auth0";
import { isTokenVaultConfigured } from "@/lib/auth/token-vault";
import {
  allowGitHubPersonalAccessTokenFallback,
  allowTokenVaultAccessTokenOverride,
  areExternalWritesEnabled,
  getAuthrixDeploymentMode,
  getRuntimeConnectScopes,
} from "@/lib/security/config";
import { getRuntimeToolPolicy } from "@/lib/security/runtime-policy";
import { resolveRuntimeProvider } from "@/lib/runtime/config";
import type { SecurityGuardrailStatus, SecurityPosture } from "@/types/security";

export function getSecurityPosture(): SecurityPosture {
  const checkedAt = new Date().toISOString();
  const deploymentMode = getAuthrixDeploymentMode();
  const externalWritesEnabled = areExternalWritesEnabled();
  const personalAccessTokenFallbackEnabled = allowGitHubPersonalAccessTokenFallback();
  const tokenVaultOverrideEnabled = allowTokenVaultAccessTokenOverride();
  const runtimeProvider = resolveRuntimeProvider();
  const runtimeConnectScopes = getRuntimeConnectScopes();
  const runtimeToolPolicy = getRuntimeToolPolicy();

  const guardrails: SecurityGuardrailStatus[] = [
    {
      id: "deployment-boundary",
      label: "Deployment boundary",
      state: deploymentMode === "worker-box" ? "enabled" : "warning",
      message:
        deploymentMode === "worker-box"
          ? "Authrix is configured for a dedicated worker-box deployment model."
          : "Authrix is still running in local development mode instead of the preferred worker-box posture.",
    },
    {
      id: "auth0-token-custody",
      label: "Delegated identity",
      state: isAuthConfigured && isTokenVaultConfigured ? "enabled" : isAuthConfigured ? "warning" : "disabled",
      message:
        isAuthConfigured && isTokenVaultConfigured
          ? "Auth0 login and Token Vault delegated access are active."
          : isAuthConfigured
            ? "Auth0 login is active, but Token Vault delegated access is not fully configured."
            : "Auth0 is not configured, so delegated identity protections are incomplete.",
    },
    {
      id: "external-write-policy",
      label: "External write policy",
      state:
        externalWritesEnabled && deploymentMode === "worker-box"
          ? "enabled"
          : externalWritesEnabled
            ? "warning"
            : "enabled",
      message: externalWritesEnabled
        ? deploymentMode === "worker-box"
          ? "Approved external writes are enabled for this worker-box deployment."
          : "Approved external writes are enabled outside the preferred worker-box deployment boundary."
        : "Approved external writes are blocked by policy until explicitly enabled.",
    },
    {
      id: "credential-fallbacks",
      label: "Credential fallbacks",
      state:
        personalAccessTokenFallbackEnabled || tokenVaultOverrideEnabled ? "warning" : "enabled",
      message:
        personalAccessTokenFallbackEnabled || tokenVaultOverrideEnabled
          ? "One or more development credential fallbacks are enabled. Keep these off for serious worker-box deployments."
          : "Manual credential fallbacks are disabled by policy.",
    },
    {
      id: "runtime-scope-posture",
      label: "Runtime scope posture",
      state:
        runtimeConnectScopes.length <= 2 &&
        runtimeConnectScopes.every((scope) => scope === "operator.read" || scope === "operator.write")
          ? "enabled"
          : "warning",
      message: `Runtime connect scopes: ${runtimeConnectScopes.join(", ")}.`,
    },
    {
      id: "runtime-tool-policy",
      label: "Runtime tool policy",
      state:
        !runtimeToolPolicy.hostLevelToolsAllowed &&
        runtimeToolPolicy.allowedTools.length === 0
          ? "enabled"
          : runtimeToolPolicy.hostLevelToolsAllowed
            ? "warning"
            : "enabled",
      message:
        runtimeToolPolicy.allowedTools.length > 0
          ? `Runtime tool allowlist is active for ${runtimeToolPolicy.allowedTools.join(", ")}.`
          : runtimeToolPolicy.hostLevelToolsAllowed
            ? "Host-level runtime tools are allowed by policy."
            : "Host-level runtime tools are blocked by default unless explicitly allowlisted.",
    },
    {
      id: "worker-box-readiness",
      label: "Worker-box readiness",
      state:
        deploymentMode === "worker-box" && runtimeProvider === "openclaw" && isAuthConfigured
          ? "enabled"
          : deploymentMode === "worker-box"
            ? "warning"
            : "warning",
      message:
        deploymentMode === "worker-box"
          ? runtimeProvider === "openclaw" && isAuthConfigured
            ? "Worker-box posture is aligned with a live runtime and delegated identity."
            : "Worker-box mode is enabled, but runtime or delegated identity setup is still incomplete."
          : "Authrix is not yet configured in the preferred dedicated worker-box posture.",
    },
  ];

  const warnings = guardrails
    .filter((guardrail) => guardrail.state === "warning" || guardrail.state === "disabled")
    .map((guardrail) => guardrail.message);

  return {
    checkedAt,
    deploymentMode,
    runtimeProvider,
    runtimeConnectScopes,
    runtimeToolPolicy,
    auth0Configured: isAuthConfigured,
    tokenVaultConfigured: isTokenVaultConfigured,
    externalWritesEnabled,
    personalAccessTokenFallbackEnabled,
    tokenVaultOverrideEnabled,
    guardrails,
    warnings,
  };
}
