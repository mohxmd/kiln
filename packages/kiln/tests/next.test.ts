import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, describe, expect, it } from "bun:test";

import {
  createNextAdapter,
  createNextBuildHook,
  isNextPrunableModuleFile,
} from "../src/adapter/next/index.js";
import { getAdapter } from "../src/adapter/registry.js";

const temporaryProjects: string[] = [];

function createProject(packageJson: Record<string, unknown>): string {
  const projectDir = mkdtempSync(join(tmpdir(), "kiln-test-next-"));
  temporaryProjects.push(projectDir);
  writeFileSync(join(projectDir, "package.json"), JSON.stringify(packageJson));
  return projectDir;
}

afterEach(() => {
  for (const projectDir of temporaryProjects.splice(0)) {
    rmSync(projectDir, { recursive: true, force: true });
  }
});

describe("adapter/next", () => {
  it("creates an adapter with the expected metadata", () => {
    const adapter = createNextAdapter();

    expect(adapter.framework).toBe("next");
    expect(adapter.name).toBe("Next.js");
  });

  it("retrieves the Next.js adapter from the registry", () => {
    const adapter = getAdapter("next");

    expect(adapter).toBeDefined();
    expect(adapter?.framework).toBe("next");
  });

  it("detects dependency-only Next.js projects", () => {
    const nextProject = createProject({ dependencies: { next: "latest" } });
    const unrelatedProject = createProject({
      dependencies: { react: "latest" },
    });
    const adapter = createNextAdapter();

    expect(adapter.detect(nextProject)).toBe(true);
    expect(adapter.detect(unrelatedProject)).toBe(false);
  });

  it("returns the Next static asset layout", () => {
    expect(createNextAdapter().getStaticAssetConfig()).toEqual({
      dir: "static",
      urlPrefix: "/_next/static",
    });
  });

  it("owns Next-specific build-output pruning", () => {
    expect(isNextPrunableModuleFile("next/dist/compiled/webpack/bundle5.js")).toBe(true);
    expect(isNextPrunableModuleFile("next/dist/compiled/next-server/app-page.dev.js")).toBe(true);
    expect(isNextPrunableModuleFile("server/app/page.js")).toBe(false);
  });

  it("does not re-embed Kiln-generated files as Next runtime assets", () => {
    const projectDir = createProject({ dependencies: { next: "latest" } });
    const standaloneDir = join(projectDir, ".next", "standalone");
    mkdirSync(standaloneDir, { recursive: true });
    writeFileSync(join(standaloneDir, "server.js"), "server");
    writeFileSync(join(standaloneDir, "assets.generated.js"), "generated");
    writeFileSync(join(standaloneDir, "server-entry.js"), "generated");

    const runtimeFiles = createNextAdapter().getRuntimeFiles?.({
      standaloneDir,
      distDir: join(projectDir, ".next"),
      projectDir,
    });

    expect(runtimeFiles?.map((file) => file.relativePath)).toEqual(["server.js"]);
  });

  it("generates the default server entry with SSR and static routing support", () => {
    const source = createNextAdapter().generateServerEntry({
      standaloneDir: "/tmp/app/.next/standalone",
      distDir: "/tmp/app/.next",
      projectDir: "/tmp/app",
      assets: [],
      assetPrefix: "",
      buildStamp: "test-stamp",
      engine: "default",
    });

    expect(source).toContain("startServer({");
    expect(source).toContain("_next/static/");
    expect(source).toContain("public");
    expect(source).toContain('process.env.NODE_ENV = "production"');
  });

  it("forces standalone output only during production builds", () => {
    const hook = createNextBuildHook();
    const config = { output: "export", transpilePackages: ["app"] };

    const productionConfig = hook.modifyConfig(config, {
      phase: "phase-production-build",
    });
    const developmentConfig = hook.modifyConfig(
      { output: "export" },
      { phase: "phase-development-server" },
    );

    expect(productionConfig.output).toBe("standalone");
    expect(productionConfig.transpilePackages).toEqual(["app"]);
    expect(developmentConfig.output).toBe("export");
  });

  it("rejects explicitly requested Webpack builds", () => {
    const hook = createNextBuildHook();
    const originalArgv = process.argv;
    process.argv = [...originalArgv, "--webpack"];

    try {
      expect(() => hook.modifyConfig({}, { phase: "phase-production-build" })).toThrow(
        "webpack mode is not supported",
      );
    } finally {
      process.argv = originalArgv;
    }
  });

  it("persists the build context and missing NFT manifest", async () => {
    const projectDir = createProject({ dependencies: { next: "latest" } });
    const distDir = join(projectDir, ".next");
    mkdirSync(distDir);
    const hook = createNextBuildHook();

    await hook.onBuildComplete({
      distDir,
      projectDir,
      config: { assetPrefix: "" },
    });

    expect(existsSync(join(distDir, "next-server.js.nft.json"))).toBe(true);
    expect(JSON.parse(readFileSync(join(distDir, "kiln-ctx.json"), "utf8"))).toEqual({
      distDir,
      projectDir,
      assetPrefix: "",
    });
  });
});
