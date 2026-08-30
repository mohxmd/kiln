import { describe, expect, it } from "bun:test";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { createAstroAdapter } from "../src/adapter/astro/index.js";
import { getAdapter } from "../src/adapter/registry.js";
import { withTempDir } from "./helpers/temp-dir.js";

describe("adapter/astro", () => {
  it("creates adapter with correct metadata", () => {
    const adapter = createAstroAdapter();
    expect(adapter.framework).toBe("astro");
    expect(adapter.name).toBe("Astro");
  });

  it("retrieves astro adapter from registry", () => {
    const adapter = getAdapter("astro");
    expect(adapter).toBeDefined();
    expect(adapter?.framework).toBe("astro");
    expect(adapter?.name).toBe("Astro");
  });

  it("returns static asset config for dist/client", () => {
    const adapter = createAstroAdapter();
    const config = adapter.getStaticAssetConfig();
    expect(config.dir).toBe("client");
    expect(config.urlPrefix).toBe("");
  });

  it("detects Astro projects without matching unrelated projects", () => {
    withTempDir("astro-detect", (projectDir) => {
      writeFileSync(join(projectDir, "astro.config.mjs"), "export default {};");

      expect(createAstroAdapter().detect(projectDir)).toBe(true);
    });

    withTempDir("astro-dependency", (projectDir) => {
      writeFileSync(
        join(projectDir, "package.json"),
        JSON.stringify({ devDependencies: { astro: "latest" } }),
      );

      expect(createAstroAdapter().detect(projectDir)).toBe(true);
    });

    withTempDir("non-astro", (projectDir) => {
      expect(createAstroAdapter().detect(projectDir)).toBe(false);
    });
  });
});
