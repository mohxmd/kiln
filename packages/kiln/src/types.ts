/**
 * Shared types for Kiln compiler core.
 */

export interface BuildContext {
  distDir: string;
  projectDir: string;
  assetPrefix?: string;
  basePath?: string;
  hasRewrites?: boolean;
}

export interface CompileStandaloneOptions {
  standaloneDir: string;
  outfile: string;
  extraArgs?: readonly string[];
  extraDefines?: readonly string[];
}

export interface CompileAppOptions {
  projectDir: string;
  outputFile?: string;
  framework?: string;
  backend?: string;
  target?: string;
  engine?: "default" | "bun-serve";
  extraArgs?: readonly string[];
}

export interface CompileAppResult {
  outputFile: string;
  standaloneDir: string;
  framework: string;
  backend: string;
}
