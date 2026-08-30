/**
 * Generates no-op module stubs for optional or dev-only imports.
 * Stubs are provided by the framework adapter.
 */

import { existsSync, writeFileSync } from "node:fs";
import { isAbsolute, relative, resolve, sep } from "node:path";

import type { StubModule } from "../adapter/types.js";
import { ensureDirForFile } from "../utils/fs.js";
import { logInfo } from "../utils/log.js";

export function generateStubs(standaloneDir: string, stubs: readonly StubModule[]): void {
  let createdCount = 0;
  const root = resolve(standaloneDir);

  for (const stub of stubs) {
    if (isAbsolute(stub.path)) {
      throw new Error(`kiln: stub path must be relative: ${stub.path}`);
    }

    const fullPath = resolve(root, stub.path);
    const pathFromRoot = relative(root, fullPath);
    if (pathFromRoot === ".." || pathFromRoot.startsWith(`..${sep}`)) {
      throw new Error(`kiln: stub path escapes standalone directory: ${stub.path}`);
    }

    if (existsSync(fullPath)) continue;

    ensureDirForFile(fullPath);
    writeFileSync(fullPath, stub.content);
    createdCount += 1;
  }

  if (createdCount > 0) logInfo(`created ${createdCount} module stubs`);
}
