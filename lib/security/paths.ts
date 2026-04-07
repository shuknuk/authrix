import path from "node:path";

// In serverless environments like Vercel, we should use /tmp which is writable
const isServerlessEnvironment = process.env.VERCEL || process.env.NOW_REGION;
const basePath = isServerlessEnvironment ? "/tmp" : process.cwd();

export const AUTHRIX_DATA_DIR = path.resolve(basePath, ".authrix-data");

export function resolveAuthrixDataPath(...segments: string[]): string {
  const target = path.resolve(AUTHRIX_DATA_DIR, ...segments);
  assertWithinDirectory(AUTHRIX_DATA_DIR, target);
  return target;
}

export function assertWithinDirectory(root: string, target: string): void {
  const relative = path.relative(root, target);
  const isWithinRoot =
    relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));

  if (!isWithinRoot) {
    throw new Error(`Refusing to access a path outside the Authrix data directory: ${target}`);
  }
}
