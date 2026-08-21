/**
 * Asset pruning and compression utilities to minimize final binary size.
 */

/**
 * Build-time-only files that reach the standalone tree through traces
 * but can never load at production runtime -- embedding them costs binary
 * size and extraction time for no benefit.
 */
export function isPrunableModuleFile(mod: string): boolean {
  // Sourcemaps are referenced only by sourceMappingURL comments, never require()d
  if (mod.endsWith(".map")) return true;

  // Development builds are unreachable in production (NODE_ENV=production)
  if (/^next\/dist\/compiled\/next-server\/.*\.dev\.js$/.test(mod)) return true;
  if (/^(react|react-dom)\/.*\.development\.js$/.test(mod)) return true;

  // Webpack build machinery is never loaded by output builds in production
  if (mod.startsWith("next/dist/compiled/webpack/")) return true;
  if (mod.includes("/node_modules/webpack5/")) return true;

  return false;
}

/** Minimum raw size before gzip-embedding is worth the extraction-time gunzip */
export const GZ_EMBED_MIN_BYTES = 4096;

/**
 * Whether an embedded asset should be stored gzipped in the binary.
 *
 * Only extraction-bound runtime assets qualify: they are decompressed
 * once on first startup. Public/static assets stay raw if they might be
 * served directly. Native .node binaries or already compressed assets stay raw.
 */
export function shouldCompressEmbeddedAsset(
  urlPath: string,
  rawSize: number,
  gzSize: number,
): boolean {
  if (!urlPath.startsWith("__runtime/")) return false;
  if (rawSize < GZ_EMBED_MIN_BYTES) return false;
  // Skip files with little to no compression gain (images, wasm, native addons)
  if (/\.(png|jpg|jpeg|webp|gif|ico|woff|woff2|node|gz|zip)$/i.test(urlPath)) {
    return false;
  }
  return gzSize < rawSize * 0.9;
}
