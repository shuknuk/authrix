export type AuthrixDeploymentMode = "local-dev" | "worker-box";

const TRUE_VALUES = new Set(["1", "true", "yes", "on"]);
const FALSE_VALUES = new Set(["0", "false", "no", "off"]);
const ALLOWED_RUNTIME_SCOPES = new Set(["operator.read", "operator.write"]);

export function getAuthrixDeploymentMode(): AuthrixDeploymentMode {
  const raw = process.env.AUTHRIX_DEPLOYMENT_MODE?.trim().toLowerCase();
  return raw === "worker-box" ? "worker-box" : "local-dev";
}

export function areExternalWritesEnabled(): boolean {
  const explicit = readBooleanEnv("AUTHRIX_ALLOW_EXTERNAL_WRITES");
  if (explicit !== undefined) {
    return explicit;
  }

  return process.env.NODE_ENV !== "production";
}

export function allowGitHubPersonalAccessTokenFallback(): boolean {
  const explicit = readBooleanEnv("AUTHRIX_ALLOW_PERSONAL_ACCESS_TOKEN_FALLBACK");
  if (explicit !== undefined) {
    return explicit;
  }

  return process.env.NODE_ENV !== "production";
}

export function allowTokenVaultAccessTokenOverride(): boolean {
  const explicit = readBooleanEnv("AUTHRIX_ALLOW_TOKEN_VAULT_GITHUB_ACCESS_TOKEN_OVERRIDE");
  if (explicit !== undefined) {
    return explicit;
  }

  return process.env.NODE_ENV !== "production";
}

export function getRuntimeConnectScopes(): string[] {
  const configuredScopes = readCsvEnv("AUTHRIX_RUNTIME_CONNECT_SCOPES");
  const filteredScopes = (configuredScopes ?? ["operator.read", "operator.write"]).filter(
    (scope) => ALLOWED_RUNTIME_SCOPES.has(scope)
  );

  return filteredScopes.length > 0 ? filteredScopes : ["operator.read", "operator.write"];
}

export function getExternalWritePolicyMessage(target: string): string {
  return `${target} write execution is disabled by policy. Enable AUTHRIX_ALLOW_EXTERNAL_WRITES=true on a dedicated worker-box deployment to allow mediated writes.`;
}

function readBooleanEnv(name: string): boolean | undefined {
  const raw = process.env[name]?.trim().toLowerCase();
  if (!raw) {
    return undefined;
  }

  if (TRUE_VALUES.has(raw)) {
    return true;
  }

  if (FALSE_VALUES.has(raw)) {
    return false;
  }

  return undefined;
}

function readCsvEnv(name: string): string[] | undefined {
  const raw = process.env[name]?.trim();
  if (!raw) {
    return undefined;
  }

  return raw
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
}
