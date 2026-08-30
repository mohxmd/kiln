import { describe, expect, it } from "bun:test";
import { mkdirSync, readFileSync, utimesSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import type { FrameworkAdapter } from "../src/adapter/types.js";
import { generateEntryPoint } from "../src/core/generate-entry-point.js";
import { generateStubs } from "../src/core/stubs.js";
import { withTempDir } from "./helpers/temp-dir.js";

function createTestAdapter(runtimeFiles: FrameworkAdapter["getRuntimeFiles"]): FrameworkAdapter {
  return {
    framework: "test",
    name: "Test",
    detect: () => true,
    getStandaloneDir: (projectDir) => join(projectDir, "standalone"),
    getDistDir: (projectDir) => join(projectDir, "dist"),
    getStaticAssetConfig: () => ({ dir: "client", urlPrefix: "" }),
    getStubs: () => [],
    getBuildDefines: () => [],
    getRuntimeFiles: runtimeFiles,
    generateServerEntry: ({ buildStamp }) => buildStamp,
  };
}

describe("core generation", () => {
  it("rejects stub paths that escape the standalone directory", () => {
    withTempDir("stubs", (projectDir) => {
      const standaloneDir = join(projectDir, "standalone");
      mkdirSync(standaloneDir);

      generateStubs(standaloneDir, [
        { path: "nested/optional.js", content: "module.exports = {};" },
      ]);
      expect(readFileSync(join(standaloneDir, "nested", "optional.js"), "utf8")).toBe(
        "module.exports = {};",
      );

      expect(() =>
        generateStubs(standaloneDir, [{ path: "../outside.js", content: "unsafe" }]),
      ).toThrow("stub path escapes standalone directory");
    });
  });

  it("changes the extraction stamp when an asset changes without changing size", () => {
    withTempDir("build-stamp", (projectDir) => {
      const standaloneDir = join(projectDir, "standalone");
      const distDir = join(projectDir, "dist");
      const assetPath = join(projectDir, "runtime.js");
      mkdirSync(standaloneDir);
      mkdirSync(distDir);
      writeFileSync(assetPath, "aaaa");

      const adapter = createTestAdapter(() => [
        {
          absolutePath: assetPath,
          relativePath: "runtime.js",
          urlPath: "__runtime/runtime.js",
          isRuntime: true,
        },
      ]);

      utimesSync(assetPath, new Date("2020-01-01T00:00:00Z"), new Date("2020-01-01T00:00:00Z"));
      generateEntryPoint({ standaloneDir, distDir, projectDir, adapter });
      const firstStamp = readFileSync(join(standaloneDir, "server-entry.js"), "utf8");

      writeFileSync(assetPath, "bbbb");
      utimesSync(assetPath, new Date("2020-01-01T00:00:00Z"), new Date("2020-01-01T00:00:00Z"));
      generateEntryPoint({ standaloneDir, distDir, projectDir, adapter });
      const secondStamp = readFileSync(join(standaloneDir, "server-entry.js"), "utf8");

      expect(secondStamp).not.toBe(firstStamp);
    });
  });
});
