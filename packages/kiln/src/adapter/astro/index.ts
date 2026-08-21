/**
 * Astro framework adapter for Kiln compiler.
 * Supports Astro 5+ with @astrojs/node standalone output.
 */

import { existsSync } from "node:fs";
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

export function createAstroAdapter(): FrameworkAdapter {
  return {
    framework: "astro",
    name: "Astro",

    detect(projectDir: string): boolean {
      return (
        existsSync(join(projectDir, "astro.config.mjs")) ||
        existsSync(join(projectDir, "astro.config.ts")) ||
        existsSync(join(projectDir, "astro.config.js")) ||
        existsSync(join(projectDir, "astro.config.cjs"))
      );
    },

    getStandaloneDir(projectDir: string): string {
      return join(projectDir, "dist");
    },

    getDistDir(projectDir: string): string {
      return join(projectDir, "dist");
    },

    getStaticAssetConfig(): StaticAssetConfig {
      return { dir: "client", urlPrefix: "" };
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
        logInfo(`pruned ${prunedCount} unused files from Astro server output`);
      }

      return results;
    },

    generateServerEntry(ctx: ServerEntryContext): string {
      const assetExtractions = ctx.assets.map((asset) => {
        let diskPath = toPosixPath(asset.relativePath);
        if (!asset.isRuntime) {
          diskPath = `client/${asset.relativePath}`;
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

const port = parseInt(process.env.PORT, 10) || 4321;
const host = process.env.HOST || process.env.HOSTNAME || "0.0.0.0";
process.env.PORT = String(port);
process.env.HOST = host;

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
  console.log(\`[kiln] extracted \${extractions.length} Astro assets to \${baseDir}\`);
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
      const entryFile = path.join(baseDir, "server", "entry.mjs");
      if (!fs.existsSync(entryFile)) {
        throw new Error(\`Astro server entry not found at: \${entryFile}\`);
      }
      const entryUrl = pathToFileURL(entryFile).href;
      await import(entryUrl);
    })
    .catch((error) => {
      console.error("[kiln] Astro server startup failed:", error);
      process.exit(1);
    });
}
`;
    },
  };
}