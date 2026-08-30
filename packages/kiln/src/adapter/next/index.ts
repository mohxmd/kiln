/**
 * Next.js framework adapter for Kiln compiler.
 * Supports Next.js 15+ and Next.js 16 with top-level adapterPath.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type {
  EmbeddedAsset,
  FrameworkAdapter,
  RuntimeTransformResult,
  ServerEntryContext,
  StaticAssetConfig,
  StubModule,
} from "../types.js";
import { GENERATED_ASSETS_FILE } from "../../constants.js";
import { isPrunableModuleFile } from "../../core/prune.js";
import { walkDir } from "../../utils/fs.js";
import { logInfo } from "../../utils/log.js";
import { toPosixPath } from "../../utils/path.js";
import { NEXT_BUILD_DEFINES, NEXT_STUB_MODULES } from "./constants.js";
import { generateResolverHookSource } from "./resolver-hook.js";
import {
  buildCanonicalResolutions,
  findTurbopackAliases,
  patchRequireHook,
  rewriteTurbopackAliases,
  validateAliasResolutions,
} from "./turbopack.js";

export { createNextBuildHook, type NextBuildHook } from "./build-hook.js";

export function isNextPrunableModuleFile(mod: string): boolean {
  if (isPrunableModuleFile(mod)) return true;

  // Next.js build machinery is never loaded by production standalone output.
  return (
    (mod.includes("next/dist/compiled/next-server/") &&
      mod.endsWith(".dev.js")) ||
    mod.includes("next/dist/compiled/webpack/") ||
    mod.includes("node_modules/webpack5/") ||
    mod.includes("next/dist/build/webpack/")
  );
}

function getRelativeAppDir(distDir: string): string {
  const rsfPath = join(distDir, "required-server-files.json");
  if (existsSync(rsfPath)) {
    try {
      const rsf = JSON.parse(readFileSync(rsfPath, "utf-8"));
      if (typeof rsf?.relativeAppDir === "string") {
        return toPosixPath(rsf.relativeAppDir);
      }
    } catch {}
  }
  return "";
}

function hasNextDependency(projectDir: string): boolean {
  const packagePath = join(projectDir, "package.json");
  if (!existsSync(packagePath)) return false;

  try {
    const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));
    const allDependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies,
    };
    return "next" in allDependencies;
  } catch {
    return false;
  }
}

export function createNextAdapter(): FrameworkAdapter {
  return {
    framework: "next",
    name: "Next.js",

    detect(projectDir: string): boolean {
      return (
        hasNextDependency(projectDir) ||
        existsSync(join(projectDir, "next.config.ts")) ||
        existsSync(join(projectDir, "next.config.js")) ||
        existsSync(join(projectDir, "next.config.mjs")) ||
        existsSync(join(projectDir, "next.config.cjs"))
      );
    },

    getStandaloneDir(projectDir: string): string {
      return join(projectDir, ".next", "standalone");
    },

    getDistDir(projectDir: string): string {
      return join(projectDir, ".next");
    },

    getStaticAssetConfig(): StaticAssetConfig {
      return { dir: "static", urlPrefix: "/_next/static" };
    },

    getStubs(): readonly StubModule[] {
      return NEXT_STUB_MODULES;
    },

    getBuildDefines(): readonly string[] {
      return NEXT_BUILD_DEFINES;
    },

    getRuntimeFiles(ctx: {
      standaloneDir: string;
      distDir: string;
      projectDir: string;
    }): EmbeddedAsset[] {
      const { standaloneDir } = ctx;
      const allFiles = walkDir(standaloneDir);
      const results: EmbeddedAsset[] = [];
      let prunedCount = 0;

      for (const file of allFiles) {
        const posixRel = toPosixPath(file.relativePath);

        if (isNextPrunableModuleFile(posixRel)) {
          prunedCount += 1;
          continue;
        }

        results.push({
          absolutePath: file.absolutePath,
          relativePath: posixRel,
          urlPath: `__runtime/${posixRel}`,
          isRuntime: true,
        });
      }

      if (prunedCount > 0) {
        logInfo(`pruned ${prunedCount} unused files from standalone output`);
      }

      return results;
    },

    transformStandalone(ctx: {
      standaloneDir: string;
      distDir: string;
      projectDir: string;
    }): RuntimeTransformResult | void {
      const { standaloneDir, distDir } = ctx;
      patchRequireHook(standaloneDir);

      const aliases = findTurbopackAliases(standaloneDir);
      if (aliases.length === 0) return undefined;

      const resolutions = buildCanonicalResolutions(distDir, aliases);
      validateAliasResolutions(aliases, resolutions);

      const rewrittenChunks = rewriteTurbopackAliases(
        standaloneDir,
        aliases,
        resolutions,
      );

      const aliasMap: Record<string, string> = {};
      for (const [key, value] of resolutions.entries()) {
        aliasMap[key] = value;
      }

      return { rewrittenChunks, aliases: aliasMap };
    },

    generateServerEntry(ctx: ServerEntryContext): string {
      const relativeAppDir = getRelativeAppDir(ctx.distDir);
      const appPrefix = relativeAppDir ? `${relativeAppDir}/` : "";
      const isBunServe = ctx.engine === "bun-serve";

      const assetExtractions = ctx.assets.map((asset) => {
        let diskPath = toPosixPath(asset.relativePath);
        if (asset.urlPath.startsWith("/_next/static/")) {
          diskPath = `.next/static/${asset.relativePath}`;
        } else if (asset.urlPath.startsWith("/") && !asset.isRuntime) {
          diskPath = `public/${asset.relativePath}`;
        } else if (appPrefix && diskPath.startsWith(appPrefix)) {
          diskPath = diskPath.slice(appPrefix.length);
        }
        return [asset.urlPath, toPosixPath(diskPath)];
      });

      const resolverHook = generateResolverHookSource(ctx.aliases ?? {});

      return `import { assetMap, gzippedAssets } from "./${GENERATED_ASSETS_FILE}";
const path = require("node:path");
const fs = require("node:fs");
const Module = require("node:module");

const baseDir = process.env.KILN_RUNTIME_DIR
  ? path.resolve(process.env.KILN_RUNTIME_DIR)
  : path.dirname(process.execPath);

fs.mkdirSync(baseDir, { recursive: true });
process.chdir(baseDir);
process.env.NODE_ENV = "production";

const publicPort = parseInt(process.env.PORT, 10) || 3000;
const publicHost = process.env.HOSTNAME || "0.0.0.0";
const keepAliveTimeout = process.env.KEEP_ALIVE_TIMEOUT ? parseInt(process.env.KEEP_ALIVE_TIMEOUT, 10) : undefined;

function safeStaticPath(root, pathname) {
  let decoded;
  try { decoded = decodeURIComponent(pathname); } catch { return null; }
  if (decoded.includes("\\0")) return null;
  const rootPath = path.resolve(root);
  const candidate = path.resolve(rootPath, decoded.replace(/^[/\\\\]+/, ""));
  return candidate === rootPath || candidate.startsWith(rootPath + path.sep)
    ? candidate
    : null;
}

const extractions = ${JSON.stringify(assetExtractions)};
const buildStamp = ${JSON.stringify(ctx.buildStamp)} + "\\n" + baseDir;
const manifestPath = path.join(baseDir, ".kiln-extracted");

async function extractAssets() {
  try {
    if (fs.readFileSync(manifestPath, "utf-8") === buildStamp) return;
  } catch {}

  const dirs = new Set();
  for (const [, diskPath] of extractions) {
    dirs.add(path.dirname(path.join(baseDir, diskPath)));
  }
  for (const d of dirs) fs.mkdirSync(d, { recursive: true });

  let idx = 0;
  function nextIdx() { return idx < extractions.length ? idx++ : -1; }
  async function worker() {
    let i;
    while ((i = nextIdx()) >= 0) {
      const [urlPath, diskPath] = extractions[i];
      const embedded = assetMap.get(urlPath);
      if (!embedded) continue;
      const fullPath = path.join(baseDir, diskPath);
      const isGzipped = gzippedAssets.has(urlPath);

      if (isGzipped) {
        let bytes = await Bun.file(embedded).bytes();
        bytes = Bun.gunzipSync(bytes);
        await Bun.write(fullPath, bytes);
      } else {
        await Bun.write(fullPath, Bun.file(embedded));
      }
    }
  }

  const workerCount = Math.min(64, Math.max(1, extractions.length));
  await Promise.all(Array.from({ length: workerCount }, worker));

  fs.writeFileSync(manifestPath, buildStamp);
  console.log(\`[kiln] extracted \${extractions.length} assets to \${baseDir}\`);
}

if (process.argv.includes("--extract")) {
  extractAssets()
    .then(() => {
      console.log("[kiln] pre-extraction complete");
      process.exit(0);
    })
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
} else {
  extractAssets()
    .then(() => {
      ${resolverHook}

      const isBunServeEngine = ${JSON.stringify(isBunServe)};

      if (isBunServeEngine) {
        // High-Speed Bun.serve In-Memory Static Dispatch Engine
        const internalPort = 30000 + Math.floor(Math.random() * 20000);
        process.env.PORT = String(internalPort);
        process.env.HOSTNAME = "127.0.0.1";

        const appRequire = Module.createRequire(path.join(baseDir, "server.js"));
        appRequire("next");
        const { startServer } = appRequire("next/dist/server/lib/start-server");

        startServer({
          dir: baseDir,
          isDev: false,
          hostname: "127.0.0.1",
          port: internalPort,
          allowRetry: true,
          keepAliveTimeout,
        }).then(() => {
          Bun.serve({
            port: publicPort,
            hostname: publicHost,
            async fetch(req) {
              const url = new URL(req.url);
              const pathname = url.pathname;

              // Tier 1: Static /_next/static/* assets (Zero-copy native file streaming)
              if (pathname.startsWith("/_next/static/")) {
                const subPath = pathname.slice("/_next/static/".length);
                const staticFilePath = safeStaticPath(path.join(baseDir, ".next", "static"), subPath);
                const file = staticFilePath ? Bun.file(staticFilePath) : null;
                if (file && await file.exists()) {
                  return new Response(file, {
                    headers: { "Cache-Control": "public, max-age=31536000, immutable" },
                  });
                }
              }

              // Tier 2: Public static files
              const publicFilePath = safeStaticPath(path.join(baseDir, "public"), pathname);
              const publicFile = publicFilePath ? Bun.file(publicFilePath) : null;
              if (publicFile && pathname !== "/" && await publicFile.exists()) {
                return new Response(publicFile, {
                  headers: { "Cache-Control": "public, max-age=3600" },
                });
              }

              // Tier 3: Dynamic SSR, API Routes, Server Actions, and proxy.ts via Next.js server
              const targetUrl = "http://127.0.0.1:" + internalPort + pathname + url.search;
              return fetch(targetUrl, {
                method: req.method,
                headers: req.headers,
                body: req.body,
                redirect: "manual",
              });
            },
          });

          console.log(\`▲ Next.js with Bun.serve engine listening on http://\${publicHost}:\${publicPort}\`);
        }).catch((err) => {
          console.error("[kiln] server startup failed:", err);
          process.exit(1);
        });
      } else {
        // Default Official Next.js Server Engine
        process.env.PORT = String(publicPort);
        process.env.HOSTNAME = publicHost;

        const appRequire = Module.createRequire(path.join(baseDir, "server.js"));
        appRequire("next");
        const { startServer } = appRequire("next/dist/server/lib/start-server");

        return startServer({
          dir: baseDir,
          isDev: false,
          hostname: publicHost,
          port: publicPort,
          allowRetry: true,
          keepAliveTimeout,
        });
      }
    })
    .catch((error) => {
      console.error("[kiln] server startup failed:", error);
      process.exit(1);
    });
}
`;
    },
  };
}
