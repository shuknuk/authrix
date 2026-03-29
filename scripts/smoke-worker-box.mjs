import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const env = {
  ...loadEnvFile(path.join(root, ".env")),
  ...loadEnvFile(path.join(root, ".env.local")),
  ...process.env,
};

const buildIdPath = path.join(root, ".next", "BUILD_ID");
const appBaseUrl = env.APP_BASE_URL || "http://127.0.0.1:3000";
const tests = [];
const dataDirectoryWritable = ensureDataDirectory(root);

tests.push(
  test(
    "Build artifact",
    fs.existsSync(buildIdPath) ? "passed" : "failed",
    fs.existsSync(buildIdPath)
      ? "Next.js production build artifacts are present."
      : "Run npm run build before running worker-box smoke tests."
  )
);

tests.push(
  test(
    "Worker-box environment",
    env.AUTHRIX_DEPLOYMENT_MODE === "worker-box" ? "passed" : "warning",
    env.AUTHRIX_DEPLOYMENT_MODE === "worker-box"
      ? "Worker-box deployment mode is enabled."
      : "AUTHRIX_DEPLOYMENT_MODE is not set to worker-box."
  )
);

tests.push(
  test(
    "GitHub source target",
    env.GITHUB_OWNER && env.GITHUB_REPO ? "passed" : "warning",
    env.GITHUB_OWNER && env.GITHUB_REPO
      ? `GitHub target is ${env.GITHUB_OWNER}/${env.GITHUB_REPO}.`
      : "GitHub owner/repo is not fully configured yet."
  )
);

tests.push(
  test(
    "Runtime configuration",
    env.AUTHRIX_RUNTIME === "openclaw" && env.OPENCLAW_GATEWAY_URL
      ? "passed"
      : "warning",
    env.AUTHRIX_RUNTIME === "openclaw" && env.OPENCLAW_GATEWAY_URL
      ? `Runtime transport is ${env.OPENCLAW_GATEWAY_URL}.`
      : "Runtime is not yet configured for a live internal transport."
  )
);

tests.push(
  test(
    "Persisted state directory",
    dataDirectoryWritable ? "passed" : "failed",
    dataDirectoryWritable
      ? ".authrix-data is writable."
      : ".authrix-data is not writable."
  )
);

const rootFetch = await tryFetch(appBaseUrl);
tests.push(
  test(
    "HTTP root check",
    rootFetch.ok ? "passed" : "warning",
    rootFetch.ok
      ? `Authrix responded from ${appBaseUrl}.`
      : `Authrix did not respond from ${appBaseUrl}. Start the app with npm run start before treating the worker box as live.`
  )
);

const hasFailed = tests.some((item) => item.status === "failed");

console.log("Authrix worker-box smoke test");
console.log("=============================");
for (const item of tests) {
  console.log(`${symbolForStatus(item.status)} ${item.label}: ${item.message}`);
}

console.log("");
console.log(hasFailed ? "Smoke result: FAILED" : "Smoke result: PASS/WARN");
process.exit(hasFailed ? 1 : 0);

function test(label, status, message) {
  return { label, status, message };
}

function symbolForStatus(status) {
  if (status === "passed") {
    return "[pass]";
  }

  if (status === "warning") {
    return "[warn]";
  }

  return "[fail]";
}

function ensureDataDirectory(workspaceRoot) {
  try {
    const dataDir = path.join(workspaceRoot, ".authrix-data");
    fs.mkdirSync(dataDir, { recursive: true });
    const probePath = path.join(dataDir, ".smoke-probe.json");
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

async function tryFetch(baseUrl) {
  try {
    const response = await fetch(baseUrl, {
      redirect: "manual",
      signal: AbortSignal.timeout(3000),
    });
    return { ok: response.ok || response.status === 302 };
  } catch {
    return { ok: false };
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
