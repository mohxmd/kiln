/**
 * Runs Bun native compilation against generated standalone entrypoint.
 */

import { execFileSync } from "node:child_process";
import { join } from "node:path";

import {
  DEFAULT_BUN_BUILD_ARGS,
  GENERATED_SERVER_ENTRY_FILE,
} from "../constants.js";
import type { CompileStandaloneOptions } from "../types.js";
import { logError, logInfo } from "../utils/log.js";

export function compileStandalone(options: CompileStandaloneOptions): void {
  const { standaloneDir, outfile, extraArgs = [], extraDefines = [] } = options;
  const entrypoint = join(standaloneDir, GENERATED_SERVER_ENTRY_FILE);

  const defineArgs = extraDefines.flatMap((d) => ["--define", d]);

  // Support cross-compilation target via environment variable if not already supplied
  const targetEnv = process.env.KILN_TARGET || process.env.NBC_TARGET;
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

  logInfo(`compiling Bun native binary to ${outfile}`);
  try {
    execFileSync("bun", args, { stdio: "inherit" });
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
