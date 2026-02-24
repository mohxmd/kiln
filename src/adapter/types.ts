/**
 * Generic adapter contracts for multi-framework compilation support.
 *
 * Implement the FrameworkAdapter interface to add support for a new framework
 * (React Router, SvelteKit, TanStack Start, etc.).
 */

export interface StubModule {
  path: string;
  content: string;
}

export interface StaticAssetConfig {
  /** Directory name relative to distDir (e.g., "static") */
  dir: string;
  /** URL prefix for serving (e.g., "/_next/static") */
  urlPrefix: string;
}

export interface EmbeddedAsset {
  absolutePath: string;
  relativePath: string;
  urlPath: string;
}

export interface ServerEntryContext {
  standaloneDir: string;
  distDir: string;
  projectDir: string;
  assets: EmbeddedAsset[];
  assetPrefix: string;
}

export interface FrameworkAdapter {
  /** Unique key, e.g. "next", "react-router", "svelte" */
  framework: string;
  /** Display name, e.g. "Next.js" */
  name: string;

  /** Detect if this framework is used in the project */
  detect(projectDir: string): boolean;

  /** Path to the standalone/output directory */
  getStandaloneDir(projectDir: string): string;

  /** Path to the framework build output directory */
  getDistDir(projectDir: string): string;

  /** Static asset directory and URL prefix config */
  getStaticAssetConfig(): StaticAssetConfig;

  /** Stub modules to write before compilation */
  getStubs(): readonly StubModule[];

  /** Extra --define key=value pairs for bun build */
  getBuildDefines(): readonly string[];

  /** Generate the runtime server entry source code */
  generateServerEntry(ctx: ServerEntryContext): string;
}

export interface FrameworkAdapterRegistration {
  framework: string;
  create: () => FrameworkAdapter;
}
