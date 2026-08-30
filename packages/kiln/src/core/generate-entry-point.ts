/**
 * Generates standalone runtime files before Bun compilation.
 * Framework-specific logic is delegated to the adapter.
 */

import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { join, relative } from "node:path";
import { gzipSync } from "node:zlib";

import type { EmbeddedAsset, FrameworkAdapter, RuntimeTransformResult } from "../adapter/types.js";
import { GENERATED_ASSETS_FILE, GENERATED_SERVER_ENTRY_FILE } from "../constants.js";
import { walkDir } from "../utils/fs.js";
import { logInfo } from "../utils/log.js";
import { toPosixPath } from "../utils/path.js";
import { tryReadBuildContext } from "./build-context.js";
import { GZ_EMBED_MIN_BYTES, shouldCompressEmbeddedAsset } from "./prune.js";
import { generateStubs } from "./stubs.js";

export interface GenerateEntryPointOptions {
  standaloneDir: string;
  distDir: string;
  projectDir: string;
  adapter: FrameworkAdapter;
  engine?: "default" | "bun-serve";
}

function mapStaticAssets(distDir: string, adapter: FrameworkAdapter): EmbeddedAsset[] {
  const config = adapter.getStaticAssetConfig();
  const staticPath = join(distDir, config.dir);
  if (!existsSync(staticPath)) return [];

  return walkDir(staticPath).map((file) => ({
    ...file,
    urlPath: `${config.urlPrefix}/${toPosixPath(file.relativePath)}`,
    isRuntime: false,
  }));
}

function mapPublicAssets(projectDir: string): EmbeddedAsset[] {
  const publicPath = join(projectDir, "public");
  if (!existsSync(publicPath)) return [];

  return walkDir(publicPath).map((file) => ({
    ...file,
    urlPath: `/${toPosixPath(file.relativePath)}`,
    isRuntime: false,
  }));
}

function generateAssetsModule(
  standaloneDir: string,
  assets: EmbeddedAsset[],
  gzippedUrls: Set<string>,
): void {
  const imports: string[] = [];
  const mapEntries: string[] = [];

  for (let i = 0; i < assets.length; i += 1) {
    const asset = assets[i] as EmbeddedAsset;
    const variableName = `__asset_${i}`;
    const importPath = toPosixPath(relative(standaloneDir, asset.absolutePath));
    imports.push(
      `import ${variableName} from ${JSON.stringify(`./${importPath}`)} with { type: "file" };`,
    );
    mapEntries.push(`  [${JSON.stringify(asset.urlPath)}, ${variableName}],`);
  }

  const gzippedList = JSON.stringify([...gzippedUrls]);

  writeFileSync(
    join(standaloneDir, GENERATED_ASSETS_FILE),
    `${imports.join("\n")}
export const assetMap = new Map([\n${mapEntries.join("\n")}\n]);
export const gzippedAssets = new Set(${gzippedList});
`,
  );
}

export function generateEntryPoint(options: GenerateEntryPointOptions): void {
  const { standaloneDir, distDir, projectDir, adapter, engine = "default" } = options;

  // Generate fallback stubs for optional or dev-only imports
  generateStubs(standaloneDir, adapter.getStubs());

  // Execute framework-specific AST transformations (e.g. Turbopack alias rewrites)
  let transformResult: RuntimeTransformResult | undefined = undefined;
  if (adapter.transformStandalone) {
    const res = adapter.transformStandalone({
      standaloneDir,
      distDir,
      projectDir,
    });
    if (res) transformResult = res;
  }

  // Aggregate static, public, and server-side runtime assets
  const staticAssets = mapStaticAssets(distDir, adapter);
  const publicAssets = mapPublicAssets(projectDir);
  const runtimeAssets = adapter.getRuntimeFiles
    ? adapter.getRuntimeFiles({ standaloneDir, distDir, projectDir })
    : [];

  const buildContext = tryReadBuildContext(distDir);
  const assetPrefix = buildContext?.assetPrefix ?? "";

  const allAssets: EmbeddedAsset[] = [
    ...(assetPrefix.length > 0 ? [] : staticAssets),
    ...publicAssets,
    ...runtimeAssets,
  ];

  // Fast filter: verify file exists on disk
  const assetsToEmbed: EmbeddedAsset[] = allAssets.filter((asset) => {
    try {
      return statSync(asset.absolutePath).isFile();
    } catch {
      return false;
    }
  });

  if (assetPrefix.length > 0) {
    logInfo(`assetPrefix detected; skipping ${staticAssets.length} static assets (CDN hosted)`);
  }

  logInfo(
    `embedding ${assetsToEmbed.length} assets (${staticAssets.length} static + ${publicAssets.length} public + ${runtimeAssets.length} runtime)`,
  );

  // Fast Gzip compression for eligible text server chunks
  const gzStoreDir = join(distDir, "cache", ".kiln_gz");
  const gzippedUrls = new Set<string>();
  let gzSavedBytes = 0;

  for (let i = 0; i < assetsToEmbed.length; i += 1) {
    const asset = assetsToEmbed[i] as EmbeddedAsset;
    if (!asset.isRuntime) continue;

    try {
      const stat = statSync(asset.absolutePath);
      if (stat.size < GZ_EMBED_MIN_BYTES) continue;

      const raw = readFileSync(asset.absolutePath);
      const gz = gzipSync(raw, { level: 1 }); // Fast compression level
      if (shouldCompressEmbeddedAsset(asset.urlPath, raw.length, gz.length)) {
        mkdirSync(gzStoreDir, { recursive: true });
        const staged = join(gzStoreDir, `${i}.gz`);
        writeFileSync(staged, gz);
        asset.absolutePath = staged;
        gzippedUrls.add(asset.urlPath);
        gzSavedBytes += raw.length - gz.length;
      }
    } catch {
      // Keep raw if read fails
    }
  }

  if (gzippedUrls.size > 0) {
    logInfo(
      `gzip-compressed ${gzippedUrls.size} runtime assets (saved ${(gzSavedBytes / 1024 / 1024).toFixed(1)} MB)`,
    );
  }

  // Content-based build stamp used to invalidate the extraction manifest.
  // A reused runtime directory must not keep stale files after a same-size
  // asset edit or a rebuild that preserves source mtimes.
  const hasher = createHash("sha256");
  for (const asset of assetsToEmbed) {
    hasher.update(asset.urlPath);
    try {
      hasher.update(readFileSync(asset.absolutePath));
    } catch {}
  }
  const buildStamp = hasher.digest("hex");

  // Materialize embedded asset map module
  generateAssetsModule(standaloneDir, assetsToEmbed, gzippedUrls);

  // Generate runtime server entrypoint
  const serverEntrySource = adapter.generateServerEntry({
    standaloneDir,
    distDir,
    projectDir,
    assets: assetsToEmbed,
    assetPrefix,
    buildStamp,
    rewrittenChunks: transformResult?.rewrittenChunks ?? [],
    aliases: transformResult?.aliases ?? {},
    gzippedAssetUrls: [...gzippedUrls],
    engine,
  });

  writeFileSync(join(standaloneDir, GENERATED_SERVER_ENTRY_FILE), serverEntrySource);
}
