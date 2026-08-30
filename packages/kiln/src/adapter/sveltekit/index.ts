/**
 * SvelteKit framework adapter for Kiln compiler.
 *
 * Supports SvelteKit applications using @sveltejs/adapter-node with its
 * default `build` output directory.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import type {
  EmbeddedAsset,
  FrameworkAdapter,
  ServerEntryContext,
  StaticAssetConfig,
} from "../types.js";
import {
  GENERATED_ASSETS_FILE,
  GENERATED_SERVER_ENTRY_FILE,
} from "../../constants.js";
import { walkDir } from "../../utils/fs.js";
import { toPosixPath } from "../../utils/path.js";

function hasSvelteKitDependencies(projectDir: string): boolean {
  const packagePath = join(projectDir, "package.json");
  if (!existsSync(packagePath)) return false;

  try {
    const packageJson = JSON.parse(readFileSync(packagePath, "utf-8"));
    const allDependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
      ...packageJson.peerDependencies,
    };

    return (
      "@sveltejs/kit" in allDependencies &&
      "@sveltejs/adapter-node" in allDependencies
    );
  } catch {
    return false;
  }
}

export function createSvelteKitAdapter(): FrameworkAdapter {
  return {
    framework: "sveltekit",
    name: "SvelteKit",

    detect(projectDir: string): boolean {
      // Recent `sv create` projects configure the adapter in vite.config.ts;
      // the dependency pair is the stable detection signal for this adapter.
      return hasSvelteKitDependencies(projectDir);
    },

    getStandaloneDir(projectDir: string): string {
      return join(projectDir, "build");
    },

    getDistDir(projectDir: string): string {
      return join(projectDir, "build");
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
      const results: EmbeddedAsset[] = [];
      const packagePath = join(ctx.projectDir, "package.json");

      // Keep package metadata beside the extracted .js output. In particular,
      // this preserves the project's module type for adapter-node output.
      if (existsSync(packagePath)) {
        results.push({
          absolutePath: packagePath,
          relativePath: "package.json",
          urlPath: "__runtime/package.json",
          isRuntime: true,
        });
      }

      for (const file of walkDir(ctx.distDir)) {
        const relativePath = toPosixPath(file.relativePath);

        // These files are generated in distDir by Kiln itself and are already
        // compiled into the executable entrypoint.
        if (
          relativePath === GENERATED_ASSETS_FILE ||
          relativePath === GENERATED_SERVER_ENTRY_FILE
        ) {
          continue;
        }

        // build/client is mapped by getStaticAssetConfig and must not be
        // embedded twice as server runtime data.
        if (relativePath === "client" || relativePath.startsWith("client/")) {
          continue;
        }

        results.push({
          absolutePath: file.absolutePath,
          relativePath,
          urlPath: `__runtime/${relativePath}`,
          isRuntime: true,
        });
      }

      return results;
    },

    generateServerEntry(ctx: ServerEntryContext): string {
      if (ctx.engine === "bun-serve") {
        throw new Error(
          "kiln: SvelteKit currently supports only the default runtime engine",
        );
      }

      const assetExtractions = ctx.assets.map((asset) => {
        let diskPath = toPosixPath(asset.relativePath);
        if (!asset.isRuntime) {
          diskPath = `client/${diskPath}`;
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

const port = parseInt(process.env.PORT, 10) || 3000;
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
  for (const directory of dirs) fs.mkdirSync(directory, { recursive: true });

  let index = 0;
  function nextIndex() { return index < extractions.length ? index++ : -1; }
  async function worker() {
    let current;
    while ((current = nextIndex()) >= 0) {
      const [urlPath, diskPath] = extractions[current];
      const embedded = assetMap.get(urlPath);
      if (!embedded) continue;
      const fullPath = path.join(baseDir, diskPath);

      if (gzippedAssets.has(urlPath)) {
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
  console.log(\`[kiln] extracted \${extractions.length} SvelteKit assets to \${baseDir}\`);
}

if (process.argv.includes("--extract")) {
  extractAssets()
    .then(() => {
      console.log("[kiln] pre-extraction complete");
      process.exit(0);
    })
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
} else {
  extractAssets()
    .then(async () => {
      const entryFile = path.join(baseDir, "index.js");
      if (!fs.existsSync(entryFile)) {
        throw new Error(\`SvelteKit server entry not found at: \${entryFile}\`);
      }

      // @sveltejs/adapter-node's generated index.js starts the official
      // SvelteKit production server and preserves its request lifecycle.
      await import(pathToFileURL(entryFile).href);
    })
    .catch((error) => {
      console.error("[kiln] SvelteKit server startup failed:", error);
      process.exit(1);
    });
}
`;
    },
  };
}
