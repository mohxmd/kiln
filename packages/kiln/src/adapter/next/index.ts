/**
 * Next.js framework adapter implementation.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { GENERATED_ASSETS_FILE } from "../../constants.js";
import { isPrunableModuleFile } from "../../core/prune.js";
import { walkDir } from "../../utils/fs.js";
import { logInfo } from "../../utils/log.js";
import { toPosixPath } from "../../utils/path.js";
import type {
  EmbeddedAsset,
  FrameworkAdapter,
  RuntimeTransformResult,
  ServerEntryContext,
  StaticAssetConfig,
} from "../types.js";
import { NEXT_BUILD_DEFINES, NEXT_STUB_MODULES } from "./constants.js";
import { generateResolverHookSource } from "./resolver-hook.js";
import {
  buildCanonicalResolutions,
  findTurbopackAliases,
  patchRequireHook,
  rewriteTurbopackAliases,
  validateAliasResolutions,
} from "./turbopack.js";

export type { NextBuildHook } from "./build-hook.js";
export { createNextBuildHook } from "./build-hook.js";

function extractNextConfigLiteral(standaloneDir: string): string {
  // Prefer structured required-server-files.json over fragile regex on generated JS
  const rsfPath = join(standaloneDir, ".next", "required-server-files.json");
  if (existsSync(rsfPath)) {
    try {
      const rsf = JSON.parse(readFileSync(rsfPath, "utf-8"));
      if (rsf?.config && typeof rsf.config === "object") {
        return JSON.stringify(rsf.config);
      }
    } catch {
      // Fall through to legacy extraction
    }
  }

  // Fallback: regex-parse the standalone server.js entry
  const serverPath = join(standaloneDir, "server.js");
  if (!existsSync(serverPath)) {
    return "{}";
  }
  const serverSource = readFileSync(serverPath, "utf-8");
  const configMatch = serverSource.match(/const nextConfig = ({[\s\S]*?})\n/);
  return configMatch?.[1] ?? "{}";
}

export function createNextAdapter(): FrameworkAdapter {
  return {
    framework: "next",
    name: "Next.js",

    detect(projectDir) {
      return (
        existsSync(join(projectDir, "next.config.ts")) ||
        existsSync(join(projectDir, "next.config.js")) ||
        existsSync(join(projectDir, "next.config.mjs"))
      );
    },

    getStandaloneDir(projectDir) {
      return join(projectDir, ".next", "standalone");
    },

    getDistDir(projectDir) {
      return join(projectDir, ".next");
    },

    getStaticAssetConfig(): StaticAssetConfig {
      return { dir: "static", urlPrefix: "/_next/static" };
    },

    getStubs() {
      return NEXT_STUB_MODULES;
    },

    getBuildDefines() {
      return NEXT_BUILD_DEFINES;
    },

    getRuntimeFiles(ctx): EmbeddedAsset[] {
      const { standaloneDir } = ctx;
      const results: EmbeddedAsset[] = [];
      if (!existsSync(standaloneDir)) return results;

      const allFiles = walkDir(standaloneDir);
      let prunedCount = 0;

      for (const file of allFiles) {
        const posixRel = toPosixPath(file.relativePath);

        // Skip static directory (handled separately by getStaticAssetConfig)
        if (posixRel.startsWith(".next/static/")) continue;

        // Prune sourcemaps, development modules, and webpack internals
        if (isPrunableModuleFile(posixRel)) {
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
        logInfo(`pruned ${prunedCount} unused build/debug files from standalone output`);
      }

      return results;
    },

    transformStandalone(ctx): RuntimeTransformResult {
      const { standaloneDir } = ctx;
      const standaloneNextDir = join(standaloneDir, ".next");

      // Patch require-hook for safe require.resolve in compiled binaries
      patchRequireHook(standaloneDir);

      // Discover and resolve Turbopack mangled aliases
      const aliases = findTurbopackAliases(standaloneNextDir);
      const externalRoot = join(standaloneDir, "node_modules");
      const resolutions = buildCanonicalResolutions(externalRoot, aliases);
      validateAliasResolutions(aliases, resolutions);

      // In-place rewrite of server chunk references to canonical target paths
      const rewrittenChunks = rewriteTurbopackAliases(
        standaloneNextDir,
        aliases,
        resolutions,
      );

      const aliasMap = Object.fromEntries(
        aliases.map((a) => [a.alias, a.target]),
      );

      return { rewrittenChunks, aliases: aliasMap };
    },

    generateServerEntry(ctx: ServerEntryContext): string {
      const nextConfigLiteral = extractNextConfigLiteral(ctx.standaloneDir);
      const resolverHook = generateResolverHookSource(ctx.aliases ?? {});

      const assetExtractions = ctx.assets.map((asset) => {
        let diskPath = asset.relativePath;
        if (asset.urlPath.startsWith("/_next/static/")) {
          diskPath = `.next/static/${asset.relativePath}`;
        } else if (asset.urlPath.startsWith("/") && !asset.isRuntime) {
          diskPath = `public/${asset.relativePath}`;
        }
        return [asset.urlPath, toPosixPath(diskPath)];
      });

      const rewrittenChunksArray = ctx.rewrittenChunks ?? [];

      return `import { assetMap, gzippedAssets } from "./${GENERATED_ASSETS_FILE}";
const path = require("path");
const fs = require("fs");
const Module = require("module");

const baseDir = process.env.KILN_RUNTIME_DIR
  ? path.resolve(process.env.KILN_RUNTIME_DIR)
  : path.dirname(process.execPath);

fs.mkdirSync(baseDir, { recursive: true });
process.chdir(baseDir);
process.env.NODE_ENV = "production";

${resolverHook}

const nextConfig = ${nextConfigLiteral};
process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(nextConfig);

const port = parseInt(process.env.PORT, 10) || 3000;
const hostname = process.env.HOSTNAME || "0.0.0.0";
let keepAliveTimeout = parseInt(process.env.KEEP_ALIVE_TIMEOUT, 10);
if (Number.isNaN(keepAliveTimeout) || !Number.isFinite(keepAliveTimeout) || keepAliveTimeout < 0) {
  keepAliveTimeout = undefined;
}

const extractions = ${JSON.stringify(assetExtractions)};
const rewrittenChunks = new Set(${JSON.stringify(rewrittenChunksArray)});
const buildStamp = ${JSON.stringify(ctx.buildStamp)} + "\\n" + baseDir;
const manifestPath = path.join(baseDir, ".next", ".kiln-extracted");

async function extractAssets() {
  // Fast path: skip extraction if already extracted in this directory
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

      if (isGzipped || rewrittenChunks.has(diskPath)) {
        let bytes = await Bun.file(embedded).bytes();
        if (isGzipped) bytes = Bun.gunzipSync(bytes);
        if (rewrittenChunks.has(diskPath)) {
          const text = new TextDecoder().decode(bytes);
          await Bun.write(fullPath, text.split("__KILN_BASE__").join(baseDir));
        } else {
          await Bun.write(fullPath, bytes);
        }
      } else {
        await Bun.write(fullPath, Bun.file(embedded));
      }
    }
  }

  const workerCount = Math.min(64, Math.max(1, extractions.length));
  await Promise.all(Array.from({ length: workerCount }, worker));

  fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
  fs.writeFileSync(manifestPath, buildStamp);
  console.log(\`[kiln] extracted \${extractions.length} assets to \${baseDir}\`);
}

// Docker / CI pre-extraction flag
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
      require("next");
      const { startServer } = require("next/dist/server/lib/start-server");
      return startServer({
        dir: baseDir,
        isDev: false,
        config: nextConfig,
        hostname,
        port,
        allowRetry: false,
        keepAliveTimeout,
      });
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
