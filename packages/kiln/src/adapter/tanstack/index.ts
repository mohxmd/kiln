/**
 * TanStack Start framework adapter for Kiln compiler.
 * Supports TanStack Start and Nitro-powered fullstack applications.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type {
  EmbeddedAsset,
  FrameworkAdapter,
  ServerEntryContext,
  StaticAssetConfig,
} from "../types.js";
import { GENERATED_ASSETS_FILE } from "../../constants.js";
import { isPrunableModuleFile } from "../../core/prune.js";
import { walkDir } from "../../utils/fs.js";
import { logInfo } from "../../utils/log.js";
import { toPosixPath } from "../../utils/path.js";

function hasTanStackDependency(projectDir: string): boolean {
  const pkgPath = join(projectDir, "package.json");
  if (!existsSync(pkgPath)) return false;

  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    };
    return (
      "@tanstack/start" in allDeps ||
      "@tanstack/react-start" in allDeps
    );
  } catch {
    return false;
  }
}

export function createTanStackAdapter(): FrameworkAdapter {
  return {
    framework: "tanstack",
    name: "TanStack Start",

    detect(projectDir: string): boolean {
      return (
        existsSync(join(projectDir, "app.config.ts")) ||
        existsSync(join(projectDir, "app.config.js")) ||
        existsSync(join(projectDir, "app.config.mjs")) ||
        existsSync(join(projectDir, "app.config.cjs")) ||
        hasTanStackDependency(projectDir)
      );
    },

    getStandaloneDir(projectDir: string): string {
      return join(projectDir, ".output");
    },

    getDistDir(projectDir: string): string {
      return join(projectDir, ".output");
    },

    getStaticAssetConfig(): StaticAssetConfig {
      return { dir: "public", urlPrefix: "" };
    },

    getStubs() {
      return [];
    },

    getBuildDefines() {
      return [];
    },

    getRuntimeFiles(ctx: {
      standaloneDir: string;
      distDir: string;
      projectDir: string;
    }): EmbeddedAsset[] {
      const { distDir } = ctx;
      const serverDir = join(distDir, "server");
      const results: EmbeddedAsset[] = [];
      if (!existsSync(serverDir)) return results;

      const allFiles = walkDir(serverDir);
      let prunedCount = 0;

      for (const file of allFiles) {
        const posixRel = toPosixPath(file.relativePath);

        if (isPrunableModuleFile(posixRel)) {
          prunedCount += 1;
          continue;
        }

        results.push({
          absolutePath: file.absolutePath,
          relativePath: `server/${posixRel}`,
          urlPath: `__runtime/server/${posixRel}`,
          isRuntime: true,
        });
      }

      if (prunedCount > 0) {
        logInfo(`pruned ${prunedCount} unused files from TanStack Start server output`);
      }

      return results;
    },

    generateServerEntry(ctx: ServerEntryContext): string {
      const isBunServe = ctx.engine === "bun-serve";

      const assetExtractions = ctx.assets.map((asset) => {
        let diskPath = toPosixPath(asset.relativePath);
        if (!asset.isRuntime) {
          diskPath = `public/${asset.relativePath}`;
        }
        return [asset.urlPath, diskPath];
      });

      return `import { assetMap, gzippedAssets } from "./${GENERATED_ASSETS_FILE}";
import { pathToFileURL } from "node:url";
const path = require("node:path");
const fs = require("node:fs");

const baseDir = process.env.KILN_RUNTIME_DIR
  ? path.resolve(process.env.KILN_RUNTIME_DIR)
  : path.dirname(process.execPath);

fs.mkdirSync(baseDir, { recursive: true });
process.chdir(baseDir);
process.env.NODE_ENV = "production";

const publicPort = parseInt(process.env.PORT || process.env.NITRO_PORT, 10) || 3000;
const publicHost = process.env.HOST || process.env.NITRO_HOST || process.env.HOSTNAME || "0.0.0.0";

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
  console.log(\`[kiln] extracted \${extractions.length} TanStack Start assets to \${baseDir}\`);
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
    .then(async () => {
      const isBunServeEngine = ${JSON.stringify(isBunServe)};
      const entryFile = path.join(baseDir, "server", "index.mjs");
      if (!fs.existsSync(entryFile)) {
        throw new Error(\`TanStack Start server entry not found at: \${entryFile}\`);
      }

      if (isBunServeEngine) {
        const internalPort = 30000 + Math.floor(Math.random() * 20000);
        process.env.PORT = String(internalPort);
        process.env.NITRO_PORT = String(internalPort);
        process.env.HOST = "127.0.0.1";
        process.env.NITRO_HOST = "127.0.0.1";

        await import(pathToFileURL(entryFile).href);

        Bun.serve({
          port: publicPort,
          hostname: publicHost,
          async fetch(req) {
            const url = new URL(req.url);
            const pathname = url.pathname;

            // Tier 1: Static public assets (zero-copy file stream)
            const publicFilePath = safeStaticPath(path.join(baseDir, "public"), pathname);
            const publicFile = publicFilePath ? Bun.file(publicFilePath) : null;
            if (publicFile && pathname !== "/" && await publicFile.exists()) {
              return new Response(publicFile, {
                headers: { "Cache-Control": "public, max-age=3600" },
              });
            }

            // Tier 2: Dynamic TanStack Start / Nitro SSR & Server Functions
            const targetUrl = "http://127.0.0.1:" + internalPort + pathname + url.search;
            return fetch(targetUrl, {
              method: req.method,
              headers: req.headers,
              body: req.body,
              redirect: "manual",
            });
          },
        });

        console.log(\`▲ TanStack Start with Bun.serve engine listening on http://\${publicHost}:\${publicPort}\`);
      } else {
        process.env.PORT = String(publicPort);
        process.env.NITRO_PORT = String(publicPort);
        process.env.HOST = publicHost;
        process.env.NITRO_HOST = publicHost;

        await import(pathToFileURL(entryFile).href);
      }
    })
    .catch((error) => {
      console.error("[kiln] TanStack Start server startup failed:", error);
      process.exit(1);
    });
}
`;
    },
  };
}
