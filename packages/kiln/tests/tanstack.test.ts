import { describe, expect, it } from "bun:test";
import { createTanStackAdapter } from "../src/adapter/tanstack/index.js";
import { getAdapter } from "../src/adapter/registry.js";

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
});