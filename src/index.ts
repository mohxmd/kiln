/**
 * Public API surface for kiln.
 */

// Adapter API
export { createNextAdapter, createNextBuildHook } from "./adapter/next/index.js";
export type { NextBuildHook } from "./adapter/next/index.js";
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
  RuntimeTransformResult,
  ServerEntryContext,
  StaticAssetConfig,
  StubModule,
} from "./adapter/types.js";
// Core API
export { compileApp } from "./core/compile-app.js";
export { compileStandalone } from "./core/compile-standalone.js";
export { generateEntryPoint } from "./core/generate-entry-point.js";
export {
  GZ_EMBED_MIN_BYTES,
  isPrunableModuleFile,
  shouldCompressEmbeddedAsset,
} from "./core/prune.js";
export type {
  BuildContext,
  CompileAppOptions,
  CompileStandaloneOptions,
} from "./types.js";

// Default export: lazy Next.js build hook for experimental.adapterPath.
// Defers instantiation until property access to preserve sideEffects:false.
import { createNextBuildHook as _createHook } from "./adapter/next/index.js";
import type { NextBuildHook as _NextBuildHook } from "./adapter/next/index.js";

let _nextBuildHook: _NextBuildHook | undefined;
function _getHook(): _NextBuildHook {
  if (!_nextBuildHook) _nextBuildHook = _createHook();
  return _nextBuildHook;
}

const _lazyHook = new Proxy({} as _NextBuildHook, {
  get(_target, prop: string | symbol) {
    return Reflect.get(_getHook(), prop);
  },
});
export default _lazyHook;