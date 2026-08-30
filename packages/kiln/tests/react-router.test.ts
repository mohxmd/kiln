import { describe, expect, it } from "bun:test";
import { createReactRouterAdapter } from "../src/adapter/react-router/index.js";
import { getAdapter } from "../src/adapter/registry.js";

describe("adapter/react-router", () => {
  it("creates adapter with correct metadata", () => {
    const adapter = createReactRouterAdapter();
    expect(adapter.framework).toBe("react-router");
    expect(adapter.name).toBe("React Router");
  });

  it("retrieves react-router adapter from registry", () => {
    const adapter = getAdapter("react-router");
    expect(adapter).toBeDefined();
    expect(adapter?.framework).toBe("react-router");
    expect(adapter?.name).toBe("React Router");
  });

  it("returns static asset config for build/client", () => {
    const adapter = createReactRouterAdapter();
    const config = adapter.getStaticAssetConfig();
    expect(config.dir).toBe("client");
    expect(config.urlPrefix).toBe("");
  });
});