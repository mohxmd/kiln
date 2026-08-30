import { describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createBunBackend } from "../src/backend/bun.js";
import {
  createBackendRegistry,
  createDefaultBackendRegistry,
} from "../src/backend/registry.js";
import type { CompilerBackend } from "../src/backend/types.js";

describe("compiler backends", () => {
  it("creates an isolated default registry with the stable Bun backend", () => {
    const registry = createDefaultBackendRegistry();
    const backend = registry.resolve("bun");

    expect(registry.list()).toEqual(["bun"]);
    expect(backend.id).toBe("bun");
    expect(backend.stability).toBe("stable");
  });

  it("rejects duplicate backend ids", () => {
    const backend: CompilerBackend = {
      id: "test",
      stability: "experimental",
      compile: () => ({ backend: "test", outputFile: "out" }),
    };

    expect(() => createBackendRegistry([backend, backend])).toThrow(
      'duplicate compiler backend "test"',
    );
  });

  it("constructs the Bun command through an injectable runner", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "kiln-test-backend-"));
    const entrypoint = join(projectDir, "server-entry.js");
    const outputFile = join(projectDir, "server");
    const calls: Array<{ executable: string; args: readonly string[] }> = [];

    try {
      writeFileSync(entrypoint, "export {};\n");
      const backend = createBunBackend({
        runCommand(executable, args) {
          calls.push({ executable, args });
        },
      });

      const result = backend.compile({
        entrypoint,
        outputFile,
        defines: ['process.env.RUNTIME="nodejs"'],
        extraArgs: ["--target=bun-linux-x64"],
      });

      expect(result).toEqual({ backend: "bun", outputFile });
      expect(calls).toHaveLength(1);
      expect(calls[0]?.args).toEqual(
        expect.arrayContaining([
          "build",
          entrypoint,
          "--compile",
          "--define",
          'process.env.RUNTIME="nodejs"',
          "--outfile",
          outputFile,
          "--target=bun-linux-x64",
        ]),
      );
    } finally {
      rmSync(projectDir, { recursive: true, force: true });
    }
  });

  it("fails before invoking Bun when the generated entrypoint is missing", () => {
    let invoked = false;
    const backend = createBunBackend({
      runCommand() {
        invoked = true;
      },
    });

    expect(() =>
      backend.compile({
        entrypoint: "/tmp/kiln-entrypoint-that-does-not-exist.js",
        outputFile: "/tmp/kiln-server",
      }),
    ).toThrow("generated entrypoint not found");
    expect(invoked).toBe(false);
  });
});

