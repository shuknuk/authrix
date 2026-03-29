import path from "node:path";

export const AUTHRIX_DATA_DIR = path.resolve(process.cwd(), ".authrix-data");

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
