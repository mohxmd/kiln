import { describe, expect, it } from "bun:test";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { createTanStackAdapter } from "../src/adapter/tanstack/index.js";
import { getAdapter } from "../src/adapter/registry.js";
import { withTempDir } from "./helpers/temp-dir.js";

describe("adapter/tanstack", () => {
  it("creates adapter with correct metadata", () => {
    const adapter = createTanStackAdapter();
    expect(adapter.framework).toBe("tanstack");
    expect(adapter.name).toBe("TanStack Start");
  });

  it("retrieves tanstack adapter from registry", () => {
    const adapter = getAdapter("tanstack");
    expect(adapter).toBeDefined();
    expect(adapter?.framework).toBe("tanstack");
    expect(adapter?.name).toBe("TanStack Start");
  });

  it("returns static asset config for .output/public", () => {
    const adapter = createTanStackAdapter();
    const config = adapter.getStaticAssetConfig();
    expect(config.dir).toBe("public");
    expect(config.urlPrefix).toBe("");
  });

  it("detects TanStack dependencies without matching unrelated projects", () => {
    withTempDir("tanstack-detect", (projectDir) => {
      writeFileSync(
        join(projectDir, "package.json"),
        JSON.stringify({ dependencies: { "@tanstack/start": "latest" } }),
      );

      expect(createTanStackAdapter().detect(projectDir)).toBe(true);
    });

    withTempDir("non-tanstack", (projectDir) => {
      expect(createTanStackAdapter().detect(projectDir)).toBe(false);
    });

    withTempDir("tanstack-router-only", (projectDir) => {
      writeFileSync(
        join(projectDir, "package.json"),
        JSON.stringify({ dependencies: { "@tanstack/router": "latest" } }),
      );

      expect(createTanStackAdapter().detect(projectDir)).toBe(false);
    });
  });
});
