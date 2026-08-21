/**
 * Shared public types for kiln.
 */

export interface BuildContext {
  distDir: string;
  projectDir: string;
  assetPrefix: string;
}

export interface CompileStandaloneOptions {
  standaloneDir: string;
  outfile: string;
  extraArgs?: string[];
  extraDefines?: readonly string[];
}

export interface CompileAppOptions {
  projectDir: string;
  framework?: string;
  outputFile?: string;
  extraArgs?: string[];
}
