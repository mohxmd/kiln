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
import { logInfo } from "../utils/log.js";

export function compileStandalone(options: CompileStandaloneOptions): void {
  const { standaloneDir, outfile, extraArgs = [], extraDefines = [] } = options;
  const entrypoint = join(standaloneDir, GENERATED_SERVER_ENTRY_FILE);

  const defineArgs = extraDefines.flatMap((d) => ["--define", d]);

  const args = [
    "build",
    entrypoint,
    ...DEFAULT_BUN_BUILD_ARGS,
    ...defineArgs,
    "--outfile",
    outfile,
    ...extraArgs,
  ];

  logInfo(`compiling Bun binary to ${outfile}`);
  execFileSync("bun", args, { stdio: "inherit" });
  logInfo(`compile completed -> ${outfile}`);
}
