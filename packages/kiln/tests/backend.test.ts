import { describe, expect, it } from "bun:test";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createBunBackend } from "../src/backend/bun.js";
import { createScriptCBackend } from "../src/backend/scriptc.js";
import {
  createBackendRegistry,
  createDefaultBackendRegistry,
} from "../src/backend/registry.js";
import type { CompilerBackend } from "../src/backend/types.js";

describe("compiler backends", () => {
  it("creates an isolated default registry with the stable Bun backend", () => {
    const registry = createDefaultBackendRegistry();
    const backend = registry.resolve("bun");

    expect(registry.list()).toEqual(["bun", "scriptc"]);
    expect(backend.id).toBe("bun");
    expect(backend.stability).toBe("stable");
    expect(registry.resolve("scriptc").stability).toBe("experimental");
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

  it("constructs the ScriptC command and target environment through an injectable runner", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "kiln-test-scriptc-"));
    const entrypoint = join(projectDir, "server-entry.js");
    const outputFile = join(projectDir, "server");
    const calls: Array<{
      executable: string;
      args: readonly string[];
      options?: { cwd?: string; env?: NodeJS.ProcessEnv };
    }> = [];

    try {
      writeFileSync(entrypoint, "console.log('hello');\n");
      const backend = createScriptCBackend({
        runCommand(executable, args, options) {
          calls.push({ executable, args, options });
        },
      });

      const result = backend.compile({
        entrypoint,
        outputFile,
        target: "aarch64-linux-gnu.2.36",
        workingDirectory: projectDir,
        extraArgs: ["--dynamic"],
      });

      expect(result).toEqual({ backend: "scriptc", outputFile });
      expect(calls).toHaveLength(1);
      expect(calls[0]?.args).toEqual([
        "build",
        entrypoint,
        "--emit=exe",
        "--out",
        outputFile,
        "--dynamic",
      ]);
      expect(calls[0]?.options?.cwd).toBe(projectDir);
      expect(calls[0]?.options?.env?.SCRIPTC_TARGET).toBe(
        "aarch64-linux-gnu.2.36",
      );
    } finally {
      rmSync(projectDir, { recursive: true, force: true });
    }
  });

  it("rejects WASI until Kiln has a portable HTTP host", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "kiln-test-scriptc-wasi-"));
    const entrypoint = join(projectDir, "server-entry.js");
    let invoked = false;

    try {
      writeFileSync(entrypoint, "console.log('hello');\n");
      const backend = createScriptCBackend({
        runCommand() {
          invoked = true;
        },
      });

      expect(() =>
        backend.compile({
          entrypoint,
          outputFile: join(projectDir, "server.wasm"),
          target: "wasm32-wasi",
        }),
      ).toThrow("ScriptC WASI output is not supported yet");
      expect(invoked).toBe(false);
    } finally {
      rmSync(projectDir, { recursive: true, force: true });
    }
  });

  it("rejects adapter defines that ScriptC cannot translate yet", () => {
    const projectDir = mkdtempSync(
      join(tmpdir(), "kiln-test-scriptc-defines-"),
    );
    const entrypoint = join(projectDir, "server-entry.js");

    try {
      writeFileSync(entrypoint, "console.log('hello');\n");
      const backend = createScriptCBackend({ runCommand() {} });

      expect(() =>
        backend.compile({
          entrypoint,
          outputFile: join(projectDir, "server"),
          defines: ['process.env.RUNTIME="nodejs"'],
        }),
      ).toThrow("does not support adapter build defines yet");
    } finally {
      rmSync(projectDir, { recursive: true, force: true });
    }
  });
});
