/**
 * Filesystem helpers used by compiler generation pipeline.
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { join, relative } from "node:path";

export interface WalkedFile {
  absolutePath: string;
  relativePath: string;
}

export function walkDir(
  dir: string,
  base: string = dir,
): WalkedFile[] {
  const results: WalkedFile[] = [];
  if (!existsSync(dir)) return results;

  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    if (statSync(fullPath).isDirectory()) {
      results.push(...walkDir(fullPath, base));
      continue;
    }
    results.push({
      absolutePath: fullPath,
      relativePath: relative(base, fullPath),
    });
  }

  return results;
}

export function ensureDirForFile(filePath: string): void {
  const parentDir = join(filePath, "..");
  if (!existsSync(parentDir)) mkdirSync(parentDir, { recursive: true });
}

export function writeJsonFile(path: string, value: unknown): void {
  writeFileSync(path, JSON.stringify(value, null, 2));
}

export function readJsonFile<T>(path: string): T {
  return JSON.parse(readFileSync(path, "utf-8")) as T;
}

