/**
 * Generic build-time constants used across all adapters.
 */

export const BUILD_CONTEXT_FILE = "kiln-ctx.json";
export const GENERATED_ASSETS_FILE = "assets.generated.js";
export const GENERATED_SERVER_ENTRY_FILE = "server-entry.js";

/**
 * Default Bun build flags passed to `bun build --compile`.
 *
 * Webpack and its submodules are externalized because Next.js's bundled
 * webpack (bundle5.js) contains require() calls to build-time-only plugins
 * like terser-webpack-plugin that are never executed at production runtime.
 *
 * Note: glob patterns like "webpack/*" are safe here because
 * compile-standalone.ts uses execFileSync (no shell expansion).
 */
export const DEFAULT_BUN_BUILD_ARGS: readonly string[] = [
  "--production",
  "--compile",
  "--minify",
  "--external",
  "webpack",
  "--external",
  "webpack/*",
  "--external",
  "next/dist/build/webpack/*",
  "--external",
  "sass",
  "--external",
  "critters",
];
