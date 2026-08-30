import { describe, expect, it } from "bun:test";
import { createAstroAdapter } from "../src/adapter/astro/index.js";
import { getAdapter } from "../src/adapter/registry.js";

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
});