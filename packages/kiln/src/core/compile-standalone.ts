/**
 * Runs Bun native compilation against generated standalone entrypoint.
 */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import {
  DEFAULT_BUN_BUILD_ARGS,
  GENERATED_SERVER_ENTRY_FILE,
} from "../constants.js";
import type { CompileStandaloneOptions } from "../types.js";
import { logError, logInfo } from "../utils/log.js";

function resolveBunExecutable(): string {
  // Check standard ~/.bun/bin fallback if not available on current process PATH
  const userBun = join(
    homedir(),
    ".bun",
    "bin",
    process.platform === "win32" ? "bun.exe" : "bun",
  );
  if (existsSync(userBun)) {
    return userBun;
  }
  return "bun";
}

export function compileStandalone(options: CompileStandaloneOptions): void {
  const { standaloneDir, outfile, extraArgs = [], extraDefines = [] } = options;
  const entrypoint = join(standaloneDir, GENERATED_SERVER_ENTRY_FILE);

  const defineArgs = extraDefines.flatMap((d) => ["--define", d]);

  // Support cross-compilation target via environment variable if not already supplied
  const targetEnv = process.env.KILN_TARGET;
  const hasTargetFlag = extraArgs.some((arg) => arg === "--target" || arg.startsWith("--target="));
  const targetArgs = (!hasTargetFlag && targetEnv) ? [`--target=${targetEnv}`] : [];

  const args = [
    "build",
    entrypoint,
    ...DEFAULT_BUN_BUILD_ARGS,
    ...defineArgs,
    "--outfile",
    outfile,
    ...targetArgs,
    ...extraArgs,
  ];

  const bunExec = resolveBunExecutable();
  logInfo(`compiling Bun native binary to ${outfile}`);
  try {
    execFileSync(bunExec, args, { stdio: "inherit" });
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      logError("`bun` was not found on PATH. Please install it from https://bun.sh and try again.");
      process.exit(1);
    }
    const exitCode = (err as { status?: number }).status;
    throw new Error(
      `bun build failed with exit code ${exitCode ?? "unknown"}`,
      { cause: err },
    );
  }
  logInfo(`compile completed -> ${outfile}`);
}