import { describe, expect, it } from "bun:test";
import {
  mkdtempSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { createSvelteKitAdapter } from "../src/adapter/sveltekit/index.js";
import { getAdapter } from "../src/adapter/registry.js";

function createProject(withSvelteKitDependencies: boolean): string {
  const projectDir = mkdtempSync(join(tmpdir(), "kiln-test-sveltekit-"));
  writeFileSync(
    join(projectDir, "package.json"),
    JSON.stringify({
      devDependencies: withSvelteKitDependencies
        ? { "@sveltejs/kit": "latest", "@sveltejs/adapter-node": "latest" }
        : { svelte: "latest" },
    }),
  );
  return projectDir;
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

    expect(adapter.getStandaloneDir(projectDir)).toBe(
      "/tmp/sveltekit-app/build",
    );
    expect(adapter.getDistDir(projectDir)).toBe("/tmp/sveltekit-app/build");
    expect(adapter.getStaticAssetConfig()).toEqual({
      dir: "client",
      urlPrefix: "",
    });
  });

  it("detects SvelteKit but not plain Svelte projects", () => {
    const svelteKitProject = createProject(true);
    const svelteProject = createProject(false);

    try {
      const adapter = createSvelteKitAdapter();
      expect(adapter.detect(svelteKitProject)).toBe(true);
      expect(adapter.detect(svelteProject)).toBe(false);
    } finally {
      rmSync(svelteKitProject, { recursive: true, force: true });
      rmSync(svelteProject, { recursive: true, force: true });
    }
  });

  it("embeds build runtime files but leaves build/client to static assets", () => {
    const projectDir = mkdtempSync(
      join(tmpdir(), "kiln-test-sveltekit-output-"),
    );
    const buildDir = join(projectDir, "build");

    try {
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
    } finally {
      rmSync(projectDir, { recursive: true, force: true });
    }
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
