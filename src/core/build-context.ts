/**
 * Build context persistence between Next adapter and standalone compiler step.
 */

import { existsSync } from "node:fs";
import { join } from "node:path";

import { BUILD_CONTEXT_FILE } from "../constants.js";
import type { BuildContext } from "../types.js";
import { readJsonFile, writeJsonFile } from "../utils/fs.js";

export function writeBuildContext(
  distDir: string,
  projectDir: string,
  assetPrefix: string,
): void {
  writeJsonFile(join(distDir, BUILD_CONTEXT_FILE), {
    distDir,
    projectDir,
    assetPrefix,
  } satisfies BuildContext);
}

export function readBuildContext(distDir: string): BuildContext {
  return readJsonFile<BuildContext>(join(distDir, BUILD_CONTEXT_FILE));
}

export function tryReadBuildContext(distDir: string): BuildContext | null {
  const path = join(distDir, BUILD_CONTEXT_FILE);
  if (!existsSync(path)) return null;
  return readJsonFile<BuildContext>(path);
}
