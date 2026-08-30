import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

/**
 * Run a synchronous test fixture in an isolated temporary directory.
 * Cleanup is guaranteed even when the test callback throws.
 */
export function withTempDir<T>(prefix: string, callback: (directory: string) => T): T {
  const directory = mkdtempSync(join(tmpdir(), `kiln-test-${prefix}-`));

  try {
    return callback(directory);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}
