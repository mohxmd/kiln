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
  type Stats,
} from "node:fs";
import { join, relative } from "node:path";

export interface WalkedFile {
  absolutePath: string;
  relativePath: string;
}

/**
 * statSync that returns null instead of throwing on EPERM/EACCES/ENOENT.
 * Handles Windows locked symlinks and inaccessible hoisted stores gracefully.
 */
export function tryStat(p: string): Stats | null {
  try {
    return statSync(p);
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code;
    if (code === "EPERM" || code === "EACCES" || code === "ENOENT") return null;
    throw err;
  }
}

/**
 * Recursively walk directory and return all real files.
 * Uses an internal accumulator to avoid quadratic array spread copies.
 */
export function walkDir(
  dir: string,
  base: string = dir,
): WalkedFile[] {
  const results: WalkedFile[] = [];
  if (!existsSync(dir)) return results;
  walkDirInto(results, dir, base);
  return results;
}

function walkDirInto(out: WalkedFile[], dir: string, base: string): void {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = tryStat(fullPath);
    if (!stat) continue;

    if (stat.isDirectory()) {
      walkDirInto(out, fullPath, base);
    } else {
      out.push({
        absolutePath: fullPath,
        relativePath: relative(base, fullPath),
      });
    }
  }
}

/**
 * Find all package directories across standalone tree, including .bun and .pnpm stores.
 */
export function findPackageDirs(standaloneDir: string, pkg: string): string[] {
  const dirs: string[] = [];
  const prefix = pkg.startsWith("@")
    ? pkg.split("/")[0] + "+" + pkg.split("/")[1]
    : pkg;
  const seen = new Set<string>();

  const checkNodeModules = (nodeModulesDir: string) => {
    const direct = join(nodeModulesDir, pkg);
    if (existsSync(direct) && !seen.has(direct)) {
      seen.add(direct);
      dirs.push(direct);
    }
    for (const store of [".bun", ".pnpm"]) {
      const storeDir = join(nodeModulesDir, store);
      if (!existsSync(storeDir)) continue;
      let entries: string[];
      try {
        entries = readdirSync(storeDir);
      } catch {
        continue;
      }
      for (const entry of entries) {
        if (!entry.startsWith(prefix + "@")) continue;
        const hoisted = join(storeDir, entry, "node_modules", pkg);
        if (existsSync(hoisted) && !seen.has(hoisted)) {
          seen.add(hoisted);
          dirs.push(hoisted);
        }
      }
    }
  };

  // Directories that never contain nested node_modules — skip to avoid wasted I/O
  const SKIP_DIRS = new Set(["cache", "trace", ".git", ".cache", "static"]);

  const walk = (dir: string) => {
    let entries: string[];
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (SKIP_DIRS.has(entry)) continue;
      const full = join(dir, entry);
      if (entry === "node_modules") {
        checkNodeModules(full);
        continue;
      }
      const stat = tryStat(full);
      if (stat && stat.isDirectory()) walk(full);
    }
  };

  walk(standaloneDir);
  return dirs;
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
