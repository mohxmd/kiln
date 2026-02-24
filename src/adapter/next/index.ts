/**
 * Next.js framework adapter implementation.
 */

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { GENERATED_ASSETS_FILE } from "../../constants.js";
import { toPosixPath } from "../../utils/path.js";
import type { FrameworkAdapter, ServerEntryContext, StaticAssetConfig } from "../types.js";
import { NEXT_BUILD_DEFINES, NEXT_STUB_MODULES } from "./constants.js";

export type { NextBuildHook } from "./build-hook.js";
export { createNextBuildHook } from "./build-hook.js";

function extractNextConfigLiteral(standaloneDir: string): string {
  const serverSource = readFileSync(join(standaloneDir, "server.js"), "utf-8");
  const configMatch = serverSource.match(/const nextConfig = ({[\s\S]*?})\n/);
  const configLiteral = configMatch?.[1];
  if (!configLiteral) {
    throw new Error("kiln: failed to extract nextConfig from standalone server.js");
  }
  return configLiteral;
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

    generateServerEntry(ctx: ServerEntryContext): string {
      const nextConfigLiteral = extractNextConfigLiteral(ctx.standaloneDir);

      const assetExtractions = ctx.assets.map((asset) => {
        const diskPath = asset.urlPath.startsWith("/_next/static/")
          ? `.next/static/${asset.relativePath}`
          : `public/${asset.relativePath}`;
        return [asset.urlPath, toPosixPath(diskPath)];
      });

      return `import { assetMap } from "./${GENERATED_ASSETS_FILE}";
const path = require("path");
const fs = require("fs");

const baseDir = path.dirname(process.execPath);
process.chdir(baseDir);
process.env.NODE_ENV = "production";

const nextConfig = ${nextConfigLiteral};
process.env.__NEXT_PRIVATE_STANDALONE_CONFIG = JSON.stringify(nextConfig);

const port = parseInt(process.env.PORT, 10) || 3000;
const hostname = process.env.HOSTNAME || "0.0.0.0";
let keepAliveTimeout = parseInt(process.env.KEEP_ALIVE_TIMEOUT, 10);
if (Number.isNaN(keepAliveTimeout) || !Number.isFinite(keepAliveTimeout) || keepAliveTimeout < 0) {
  keepAliveTimeout = undefined;
}

const extractions = ${JSON.stringify(assetExtractions)};
async function extractAssets() {
  let extracted = 0;
  for (const [urlPath, diskPath] of extractions) {
    const fullPath = path.join(baseDir, diskPath);
    if (fs.existsSync(fullPath)) continue;
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    const embedded = assetMap.get(urlPath);
    if (embedded) {
      await Bun.write(fullPath, Bun.file(embedded));
      extracted += 1;
    }
  }
  if (extracted > 0) console.log(\`kiln: extracted \${extracted} assets\`);
}

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
    console.error(error);
    process.exit(1);
  });
`;
    },
  };
}
