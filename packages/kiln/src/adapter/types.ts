/**
 * Generic adapter contracts for multi-framework compilation support.
 *
 * Implement the FrameworkAdapter interface to add support for a new framework
 * (Next.js, Astro, React Router, SvelteKit, TanStack Start, Nitro, etc.).
 */

export interface StubModule {
  /** Relative path in standalone directory where stub should be created */
  path: string;
  /** Stub content (typically "module.exports = {};") */
  content: string;
}

export interface StaticAssetConfig {
  /** Directory name relative to distDir (e.g., "static" or "client") */
  dir: string;
  /** URL prefix for serving (e.g., "/_next/static" or "/assets") */
  urlPrefix: string;
}

export interface EmbeddedAsset {
  /** Absolute file path on the build machine */
  absolutePath: string;
  /** Normalized relative path within build output */
  relativePath: string;
  /** URL path or virtual key used for runtime lookup */
  urlPath: string;
  /** Whether this asset is part of the server-side runtime extraction */
  isRuntime?: boolean;
}

export interface RuntimeTransformResult {
  /** List of server chunk paths rewritten for runtime compatibility */
  rewrittenChunks?: string[];
  /** Map of Turbopack alias hashes to canonical package paths */
  aliases?: Record<string, string>;
}

export interface ServerEntryContext {
  /** Directory containing framework standalone output */
  standaloneDir: string;
  /** Framework build distribution directory (.next, dist, etc.) */
  distDir: string;
  /** Root directory of the application */
  projectDir: string;
  /** All embedded assets (static, public, runtime) */
  assets: EmbeddedAsset[];
  /** CDN asset prefix if detected */
  assetPrefix: string;
  /** Deterministic SHA-256 build hash */
  buildStamp: string;
  /** Server chunks rewritten during build */
  rewrittenChunks?: string[];
  /** Module aliases for runtime resolution */
  aliases?: Record<string, string>;
  /** URLs of runtime assets compressed with Gzip */
  gzippedAssetUrls?: string[];
  /** Runtime HTTP server engine: "default" | "bun-serve" */
  engine?: "default" | "bun-serve";
}

export interface FrameworkAdapter {
  /** Unique key, e.g. "next", "astro", "react-router" */
  readonly framework: string;
  /** Display name, e.g. "Next.js", "Astro" */
  readonly name: string;

  /** Detect if this framework is used in the given project directory */
  detect(projectDir: string): boolean;

  /** Path to the standalone/output directory */
  getStandaloneDir(projectDir: string): string;

  /** Path to the framework build output directory */
  getDistDir(projectDir: string): string;

  /** Static asset directory and URL prefix config */
  getStaticAssetConfig(): StaticAssetConfig;

  /** Collect framework server runtime files (e.g. server chunks, node_modules, manifests) */
  getRuntimeFiles?(ctx: {
    standaloneDir: string;
    distDir: string;
    projectDir: string;
  }): EmbeddedAsset[];

  /** Stub modules to write before compilation */
  getStubs(): readonly StubModule[];

  /** Extra --define key=value pairs for bun build */
  getBuildDefines(): readonly string[];

  /** Optional AST / chunk transformation step before embedding */
  transformStandalone?(ctx: {
    standaloneDir: string;
    distDir: string;
    projectDir: string;
  }): RuntimeTransformResult | void;

  /** Generate the runtime server entry source code */
  generateServerEntry(ctx: ServerEntryContext): string;
}

export interface FrameworkAdapterRegistration {
  framework: string;
  create: () => FrameworkAdapter;
}