import { describe, expect, it } from "bun:test";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { withTempDir } from "./helpers/temp-dir.js";
import {
  ensureDirForFile,
  findPackageDirs,
  readJsonFile,
  tryStat,
  walkDir,
  writeJsonFile,
} from "../src/utils/fs.js";

describe("utils/fs", () => {
  it("tryStat returns Stats for real files and null for nonexistent files", () => {
    withTempDir("stat", (tempDir) => {
      const filePath = join(tempDir, "file.txt");
      writeFileSync(filePath, "content");

      const stat = tryStat(filePath);
      expect(stat).not.toBeNull();
      expect(stat?.isFile()).toBe(true);
      expect(tryStat(join(tempDir, "missing.txt"))).toBeNull();
    });
  });

  it("walkDir collects all files in directory tree", () => {
    withTempDir("walk", (tempDir) => {
      const subDir = join(tempDir, "nested", "deeper");
      ensureDirForFile(join(subDir, "file1.txt"));
      writeFileSync(join(subDir, "file1.txt"), "hello");
      writeFileSync(join(tempDir, "root.txt"), "world");

      const files = walkDir(tempDir);
      expect(files.length).toBe(2);
      const relativePaths = files
        .map((file) => file.relativePath.replace(/\\/g, "/"))
        .sort();
      expect(relativePaths).toEqual(["nested/deeper/file1.txt", "root.txt"]);
    });
  });

  it("returns no files for a missing directory", () => {
    withTempDir("walk-missing", (tempDir) => {
      expect(walkDir(join(tempDir, "missing"))).toEqual([]);
    });
  });

  it("finds direct, Bun-store, and pnpm-store package directories", () => {
    withTempDir("packages", (tempDir) => {
      const direct = join(tempDir, "node_modules", "react");
      const bunStore = join(
        tempDir,
        "nested",
        "node_modules",
        ".bun",
        "react@19.0.0",
        "node_modules",
        "react",
      );
      const pnpmStore = join(
        tempDir,
        "node_modules",
        ".pnpm",
        "react@19.0.0",
        "node_modules",
        "react",
      );

      mkdirSync(direct, { recursive: true });
      mkdirSync(bunStore, { recursive: true });
      mkdirSync(pnpmStore, { recursive: true });

      const packageDirs = findPackageDirs(tempDir, "react");

      expect(packageDirs).toEqual(
        expect.arrayContaining([direct, bunStore, pnpmStore]),
      );
      expect(new Set(packageDirs)).toHaveLength(3);
    });
  });

  it("finds scoped packages in Bun and pnpm stores", () => {
    withTempDir("scoped-packages", (tempDir) => {
      const bunStore = join(
        tempDir,
        "node_modules",
        ".bun",
        "@scope+pkg@1.0.0",
        "node_modules",
        "@scope",
        "pkg",
      );
      const pnpmStore = join(
        tempDir,
        "node_modules",
        ".pnpm",
        "@scope+pkg@1.0.0",
        "node_modules",
        "@scope",
        "pkg",
      );

      mkdirSync(bunStore, { recursive: true });
      mkdirSync(pnpmStore, { recursive: true });

      expect(findPackageDirs(tempDir, "@scope/pkg")).toEqual(
        expect.arrayContaining([bunStore, pnpmStore]),
      );
    });
  });

  it("writeJsonFile and readJsonFile persist and restore structured data", () => {
    withTempDir("json", (tempDir) => {
      const filePath = join(tempDir, "data.json");
      const sample = { framework: "next", version: 16, active: true };
      writeJsonFile(filePath, sample);

      expect(existsSync(filePath)).toBe(true);
      const restored = readJsonFile<typeof sample>(filePath);
      expect(restored).toEqual(sample);
    });
  });
});
