import { describe, expect, it } from "bun:test";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { createSvelteKitAdapter } from "../src/adapter/sveltekit/index.js";
import { getAdapter } from "../src/adapter/registry.js";
import { withTempDir } from "./helpers/temp-dir.js";

function createProject(projectDir: string, withSvelteKitDependencies: boolean): void {
  writeFileSync(
    join(projectDir, "package.json"),
    JSON.stringify({
      devDependencies: withSvelteKitDependencies
        ? { "@sveltejs/kit": "latest", "@sveltejs/adapter-node": "latest" }
        : { svelte: "latest" },
    }),
  );
}

describe("adapter/sveltekit", () => {
  it("creates adapter with correct metadata", () => {
    const adapter = createSvelteKitAdapter();
    expect(adapter.framework).toBe("sveltekit");
    expect(adapter.name).toBe("SvelteKit");
  });

  it("retrieves the SvelteKit adapter from the registry", () => {
    const adapter = getAdapter("sveltekit");
    expect(adapter).toBeDefined();
    expect(adapter?.framework).toBe("sveltekit");
  });

  it("uses the default adapter-node build layout", () => {
    const adapter = createSvelteKitAdapter();
    const projectDir = "/tmp/sveltekit-app";

    expect(adapter.getStandaloneDir(projectDir)).toBe("/tmp/sveltekit-app/build");
    expect(adapter.getDistDir(projectDir)).toBe("/tmp/sveltekit-app/build");
    expect(adapter.getStaticAssetConfig()).toEqual({
      dir: "client",
      urlPrefix: "",
    });
  });

  it("detects SvelteKit but not plain Svelte projects", () => {
    withTempDir("sveltekit-detect", (svelteKitProject) => {
      withTempDir("svelte-detect", (svelteProject) => {
        createProject(svelteKitProject, true);
        createProject(svelteProject, false);

        const adapter = createSvelteKitAdapter();
        expect(adapter.detect(svelteKitProject)).toBe(true);
        expect(adapter.detect(svelteProject)).toBe(false);
      });
    });
  });

  it("embeds build runtime files but leaves build/client to static assets", () => {
    withTempDir("sveltekit-output", (projectDir) => {
      const buildDir = join(projectDir, "build");

      mkdirSync(join(buildDir, "client", "_app"), { recursive: true });
      mkdirSync(join(buildDir, "server"), { recursive: true });
      writeFileSync(join(buildDir, "client", "index.html"), "client");
      writeFileSync(join(buildDir, "server", "index.js"), "server");
      writeFileSync(join(buildDir, "index.js"), "entry");
      writeFileSync(join(buildDir, "assets.generated.js"), "generated");
      writeFileSync(join(buildDir, "server-entry.js"), "generated");
      writeFileSync(join(projectDir, "package.json"), '{"type":"module"}');

      const runtimeFiles = createSvelteKitAdapter().getRuntimeFiles?.({
        standaloneDir: buildDir,
        distDir: buildDir,
        projectDir,
      });

      expect(runtimeFiles?.map((file) => file.relativePath)).toEqual([
        "package.json",
        "index.js",
        "server/index.js",
      ]);
    });
  });

  it("generates an entrypoint for the official SvelteKit server", () => {
    const source = createSvelteKitAdapter().generateServerEntry({
      standaloneDir: "/tmp/build",
      distDir: "/tmp/build",
      projectDir: "/tmp/project",
      assets: [],
      assetPrefix: "",
      buildStamp: "test-stamp",
      engine: "default",
    });

    expect(source).toContain('path.join(baseDir, "index.js")');
    expect(source).toContain("@sveltejs/adapter-node");
    expect(() =>
      createSvelteKitAdapter().generateServerEntry({
        standaloneDir: "/tmp/build",
        distDir: "/tmp/build",
        projectDir: "/tmp/project",
        assets: [],
        assetPrefix: "",
        buildStamp: "test-stamp",
        engine: "bun-serve",
      }),
    ).toThrow("supports only the default runtime engine");
  });
});
