/**
 * Generates standalone runtime files before Bun compilation.
 * Framework-specific logic is delegated to the adapter.
 */

import { writeFileSync } from "node:fs";
import { join, relative } from "node:path";

import type { EmbeddedAsset, FrameworkAdapter } from "../adapter/types.js";
import {
  GENERATED_ASSETS_FILE,
  GENERATED_SERVER_ENTRY_FILE,
} from "../constants.js";
import { walkDir } from "../utils/fs.js";
import { logInfo, logWarn } from "../utils/log.js";
import { toPosixPath, toSafeAssetVariableName } from "../utils/path.js";
import { tryReadBuildContext } from "./build-context.js";
import { generateStubs } from "./stubs.js";

export interface GenerateEntryPointOptions {
  standaloneDir: string;
  distDir: string;
  projectDir: string;
  adapter: FrameworkAdapter;
}

function mapStaticAssets(
  distDir: string,
  adapter: FrameworkAdapter,
): EmbeddedAsset[] {
  const config = adapter.getStaticAssetConfig();
  return walkDir(join(distDir, config.dir)).map((file) => ({
    ...file,
    urlPath: `${config.urlPrefix}/${toPosixPath(file.relativePath)}`,
  }));
}

function mapPublicAssets(projectDir: string): EmbeddedAsset[] {
  return walkDir(join(projectDir, "public")).map((file) => ({
    ...file,
    urlPath: `/${toPosixPath(file.relativePath)}`,
  }));
}

function generateAssetsModule(
  standaloneDir: string,
  assets: EmbeddedAsset[],
): void {
  const imports: string[] = [];
  const mapEntries: string[] = [];

  for (const asset of assets) {
    const variableName = toSafeAssetVariableName(asset.urlPath);
    const importPath = toPosixPath(relative(standaloneDir, asset.absolutePath));
    imports.push(
      `import ${variableName} from "./${importPath}" with { type: "file" };`,
    );
    mapEntries.push(`  ["${asset.urlPath}", ${variableName}],`);
  }

  writeFileSync(
    join(standaloneDir, GENERATED_ASSETS_FILE),
    `${imports.join("\n")}\nexport const assetMap = new Map([\n${mapEntries.join("\n")}\n]);\n`,
  );
}

export function generateEntryPoint(options: GenerateEntryPointOptions): void {
  const { standaloneDir, distDir, projectDir, adapter } = options;

  generateStubs(standaloneDir, adapter.getStubs());

  const staticAssets = mapStaticAssets(distDir, adapter);
  const publicAssets = mapPublicAssets(projectDir);
  const buildContext = tryReadBuildContext(distDir);
  const assetPrefix = buildContext?.assetPrefix ?? "";

  const assetsToEmbed =
    assetPrefix.length > 0 ? publicAssets : [...staticAssets, ...publicAssets];

  if (assetPrefix.length > 0) {
    logInfo(
      `assetPrefix detected; static assets skipped (${staticAssets.length} files)`,
    );
  } else if (!buildContext) {
    logWarn("build context not found; embedding static+public assets by default");
  }
  if (assetsToEmbed.length === 0) {
    logWarn("no assets found to embed");
  } else {
    logInfo(`embedding ${assetsToEmbed.length} assets`);
  }

  generateAssetsModule(standaloneDir, assetsToEmbed);

  const serverEntrySource = adapter.generateServerEntry({
    standaloneDir,
    distDir,
    projectDir,
    assets: assetsToEmbed,
    assetPrefix,
  });

  writeFileSync(
    join(standaloneDir, GENERATED_SERVER_ENTRY_FILE),
    serverEntrySource,
  );
}
