/**
 * Public API surface for kiln.
 */

import { createNextAdapter, createNextBuildHook } from "./adapter/next/index.js";
import { registerAdapter } from "./adapter/registry.js";

// Register built-in adapters
registerAdapter({
  framework: "next",
  create: () => createNextAdapter(),
});

export type { NextBuildHook } from "./adapter/next/index.js";
// Adapter API
export { createNextAdapter, createNextBuildHook } from "./adapter/next/index.js";
export {
  detectFramework,
  getAdapter,
  listAdapters,
  registerAdapter,
} from "./adapter/registry.js";
export type {
  EmbeddedAsset,
  FrameworkAdapter,
  FrameworkAdapterRegistration,
  ServerEntryContext,
  StaticAssetConfig,
  StubModule,
} from "./adapter/types.js";
// Core API
export { compileApp } from "./core/compile-app.js";
export { compileStandalone } from "./core/compile-standalone.js";
export { generateEntryPoint } from "./core/generate-entry-point.js";
export type {
  BuildContext,
  CompileAppOptions,
  CompileStandaloneOptions,
} from "./types.js";

// Default export: Next.js build hook for experimental.adapterPath
const nextBuildHook = createNextBuildHook();
export default nextBuildHook;
