/**
 * Generates no-op module stubs for optional or dev-only imports.
 * Stubs are provided by the framework adapter.
 */

import { existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { StubModule } from "../adapter/types.js";
import { ensureDirForFile } from "../utils/fs.js";
import { logInfo } from "../utils/log.js";

export function generateStubs(
  standaloneDir: string,
  stubs: readonly StubModule[],
): void {
  let createdCount = 0;

  for (const stub of stubs) {
    const fullPath = join(standaloneDir, stub.path);
    if (existsSync(fullPath)) continue;

    ensureDirForFile(fullPath);
    writeFileSync(fullPath, stub.content);
    createdCount += 1;
  }

  if (createdCount > 0) logInfo(`created ${createdCount} module stubs`);
}
