import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const env = {
  ...loadEnvFile(path.join(root, ".env")),
  ...loadEnvFile(path.join(root, ".env.local")),
  ...process.env,
};

const auth0Configured = hasAll(env, [
  "AUTH0_DOMAIN",
  "AUTH0_CLIENT_ID",
  "AUTH0_CLIENT_SECRET",
  "AUTH0_SECRET",
  "APP_BASE_URL",
]);
const githubConfigured = hasAll(env, ["GITHUB_OWNER", "GITHUB_REPO"]);
const dataDirectoryWritable = ensureDataDirectory(root);

const checks = [
  check(
    "Deployment mode",
    env.AUTHRIX_DEPLOYMENT_MODE === "worker-box" ? "ready" : "warning",
    env.AUTHRIX_DEPLOYMENT_MODE === "worker-box"
      ? "Worker-box posture is enabled."
      : "Set AUTHRIX_DEPLOYMENT_MODE=worker-box before real deployment."
  ),
  check(
    "Auth0 config",
    auth0Configured ? "ready" : "blocked",
    auth0Configured
      ? "Auth0 environment variables are present."
      : "Fill in the Auth0 environment variables for the control tower."
  ),
  check(
    "GitHub target",
    githubConfigured ? "ready" : "blocked",
    githubConfigured
      ? `GitHub target is ${env.GITHUB_OWNER}/${env.GITHUB_REPO}.`
      : "Set GITHUB_OWNER and GITHUB_REPO for live engineering ingestion."
  ),
  check(
    "Runtime selection",
    env.AUTHRIX_RUNTIME === "openclaw" ? "ready" : "warning",
    env.AUTHRIX_RUNTIME === "openclaw"
      ? "Internal runtime mode is selected."
      : "Authrix is still pointed at the mock runtime."
  ),
  check(
    "Runtime transport",
    env.AUTHRIX_RUNTIME === "openclaw" && !env.OPENCLAW_GATEWAY_URL
      ? "blocked"
      : "ready",
    env.AUTHRIX_RUNTIME === "openclaw" && !env.OPENCLAW_GATEWAY_URL
      ? "Set OPENCLAW_GATEWAY_URL so Authrix can reach the internal runtime transport."
      : env.OPENCLAW_GATEWAY_URL
        ? `Runtime transport is ${env.OPENCLAW_GATEWAY_URL}.`
        : "Runtime transport is not required while mock mode is selected."
  ),
  check(
    "Persisted data directory",
    dataDirectoryWritable ? "ready" : "blocked",
    dataDirectoryWritable
      ? ".authrix-data is writable."
      : ".authrix-data could not be created or written."
  ),
];

const hasBlocked = checks.some((item) => item.status === "blocked");

console.log("Authrix worker-box readiness");
console.log("============================");
for (const item of checks) {
  console.log(`${symbolForStatus(item.status)} ${item.label}: ${item.message}`);
}

console.log("");
console.log(hasBlocked ? "Readiness result: BLOCKED" : "Readiness result: OK/WARN");
process.exit(hasBlocked ? 1 : 0);

function check(label, status, message) {
  return { label, status, message };
}

function symbolForStatus(status) {
  if (status === "ready") {
    return "[ok]";
  }

  if (status === "warning") {
    return "[warn]";
  }

  return "[blocked]";
}

function hasAll(values, keys) {
  return keys.every((key) => Boolean(values[key]));
}

function ensureDataDirectory(workspaceRoot) {
  try {
    const dataDir = path.join(workspaceRoot, ".authrix-data");
    fs.mkdirSync(dataDir, { recursive: true });
    const probePath = path.join(dataDir, ".worker-box-probe.json");
    fs.writeFileSync(
      probePath,
      JSON.stringify({ checkedAt: new Date().toISOString() }),
      "utf8"
    );
    fs.unlinkSync(probePath);
    return true;
  } catch {
    return false;
  }
}

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};
  }

  const raw = fs.readFileSync(filePath, "utf8");
  const result = {};

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separator = trimmed.indexOf("=");
    if (separator === -1) {
      continue;
    }

    const key = trimmed.slice(0, separator).trim();
    const value = trimmed.slice(separator + 1).trim();
    result[key] = value;
  }

  return result;
}
