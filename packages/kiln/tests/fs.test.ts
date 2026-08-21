import { describe, expect, it } from "bun:test";
import { existsSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  ensureDirForFile,
  readJsonFile,
  tryStat,
  walkDir,
  writeJsonFile,
} from "../src/utils/fs.js";

describe("utils/fs", () => {
  it("tryStat returns Stats for real files and null for nonexistent files", () => {
    const stat = tryStat(join(process.cwd(), "package.json"));
    expect(stat).not.toBeNull();
    expect(stat?.isFile()).toBe(true);

    const nonExistent = tryStat(join(process.cwd(), "non-existent-file-12345.xyz"));
    expect(nonExistent).toBeNull();
  });

  it("walkDir collects all files in directory tree", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "kiln-test-walk-"));
    try {
      const subDir = join(tempDir, "nested", "deeper");
      ensureDirForFile(join(subDir, "file1.txt"));
      writeFileSync(join(subDir, "file1.txt"), "hello");
      writeFileSync(join(tempDir, "root.txt"), "world");

      const files = walkDir(tempDir);
      expect(files.length).toBe(2);
      const relativePaths = files.map((f) => f.relativePath.replace(/\\/g, "/")).sort();
      expect(relativePaths).toEqual(["nested/deeper/file1.txt", "root.txt"]);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("writeJsonFile and readJsonFile persist and restore structured data", () => {
    const tempDir = mkdtempSync(join(tmpdir(), "kiln-test-json-"));
    try {
      const filePath = join(tempDir, "data.json");
      const sample = { framework: "next", version: 16, active: true };
      writeJsonFile(filePath, sample);

      expect(existsSync(filePath)).toBe(true);
      const restored = readJsonFile<typeof sample>(filePath);
      expect(restored).toEqual(sample);
    } finally {
      rmSync(tempDir, { recursive: true, force: true });
    }
  });
});
