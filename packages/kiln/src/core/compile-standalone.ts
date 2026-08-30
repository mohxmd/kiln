/**
 * Backwards-compatible Bun compilation API.
 *
 * New code should resolve a CompilerBackend explicitly. This wrapper remains
 * for consumers using the existing compileStandalone API.
 */

import { getBunEntrypoint, createBunBackend } from "../backend/bun.js";
import type { CompileStandaloneOptions } from "../types.js";

export function compileStandalone(options: CompileStandaloneOptions): void {
  const { standaloneDir, outfile, extraArgs, extraDefines } = options;
  createBunBackend().compile({
    entrypoint: getBunEntrypoint(standaloneDir),
    outputFile: outfile,
    extraArgs,
    defines: extraDefines,
  });
}
