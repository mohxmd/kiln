/**
 * Generic build-time constants used across all adapters.
 */

export const BUILD_CONTEXT_FILE = "bun-compile-ctx.json";
export const GENERATED_ASSETS_FILE = "assets.generated.js";
export const GENERATED_SERVER_ENTRY_FILE = "server-entry.js";

export const DEFAULT_BUN_BUILD_ARGS = [
  "--production",
  "--compile",
  "--minify",
  "--bytecode",
  "--sourcemap",
] as const;
