/**
 * Path and identifier helpers for deterministic generated code.
 */

import { createHash } from "node:crypto";

export function toPosixPath(path: string): string {
  return path.replace(/\\/g, "/");
}

export function toSafeAssetVariableName(filePath: string): string {
  const hash = createHash("md5").update(filePath).digest("hex").slice(0, 6);
  const safePrefix = filePath.replace(/[^a-zA-Z0-9]/g, "_").slice(0, 40);
  return `asset_${safePrefix}_${hash}`;
}

