import { describe, expect, it } from "bun:test";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { withTempDir } from "./helpers/temp-dir.js";
import { generateEntryPoint } from "../src/core/generate-entry-point.js";
import { toPosixPath, toSafeAssetVariableName } from "../src/utils/path.js";

describe("utils/path", () => {
  describe("toPosixPath", () => {
    it("converts Windows backslashes to POSIX slashes", () => {
      expect(toPosixPath("foo\\bar\\baz")).toBe("foo/bar/baz");
      expect(toPosixPath(".next\\static\\chunks\\app.js")).toBe(".next/static/chunks/app.js");
    });

    it("leaves POSIX paths unchanged", () => {
      expect(toPosixPath("foo/bar/baz")).toBe("foo/bar/baz");
    });
  });

  describe("toSafeAssetVariableName", () => {
    it("replaces special characters with underscores and appends a sha256 hash slice", () => {
      const varName = toSafeAssetVariableName("static/chunks/main-app.js");
      expect(varName).toMatch(/^asset_static_chunks_main_app_js_[0-9a-f]{6}$/);
    });

    it("produces deterministic identifiers for identical inputs", () => {
      const var1 = toSafeAssetVariableName("public/images/logo.png");
      const var2 = toSafeAssetVariableName("public/images/logo.png");
      expect(var1).toBe(var2);
    });

    it("produces unique identifiers for different inputs with similar sanitization", () => {
      const var1 = toSafeAssetVariableName("app/page.js");
      const var2 = toSafeAssetVariableName("app/page.ts");
      expect(var1).not.toBe(var2);
    });
  });

  it("escapes asset filenames and URLs in generated modules", () => {
    withTempDir("assets", (projectDir) => {
      const standaloneDir = join(projectDir, "standalone");
      const publicDir = join(projectDir, "public");
      const assetName = 'quote"asset.txt';

      mkdirSync(publicDir, { recursive: true });
      mkdirSync(standaloneDir, { recursive: true });
      writeFileSync(join(publicDir, assetName), "asset");
      generateEntryPoint({
        standaloneDir,
        distDir: join(projectDir, "dist"),
        projectDir,
        adapter: {
          framework: "test",
          name: "Test",
          detect: () => true,
          getStandaloneDir: () => standaloneDir,
          getDistDir: () => join(projectDir, "dist"),
          getStaticAssetConfig: () => ({ dir: "client", urlPrefix: "" }),
          getStubs: () => [],
          getBuildDefines: () => [],
          generateServerEntry: () => "export {};",
        },
      });

      const generated = readFileSync(join(standaloneDir, "assets.generated.js"), "utf-8");
      expect(generated).toContain(JSON.stringify(`./../public/${assetName}`));
      expect(generated).toContain(JSON.stringify(`/${assetName}`));
    });
  });
});
