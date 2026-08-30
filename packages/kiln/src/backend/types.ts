/**
 * Compiler backend contracts.
 *
 * Framework adapters describe what should be compiled. Backends decide how
 * that description becomes an executable for a particular compiler/runtime.
 */

export type BackendStability = "stable" | "experimental";

export interface CompileRequest {
  /** Generated entrypoint consumed by the compiler backend. */
  readonly entrypoint: string;
  /** Output executable path. */
  readonly outputFile: string;
  /** Optional target translated into the backend's target configuration. */
  readonly target?: string;
  /** Working directory used for compiler module and config resolution. */
  readonly workingDirectory?: string;
  /** Backend-neutral compiler defines, when supported by the backend. */
  readonly defines?: readonly string[];
  /** Additional backend CLI arguments preserved for compatibility. */
  readonly extraArgs?: readonly string[];
}

export interface CompileResult {
  readonly backend: string;
  readonly outputFile: string;
}

export interface CompilerBackend {
  readonly id: string;
  readonly stability: BackendStability;
  compile(request: CompileRequest): CompileResult;
}

export interface BackendRegistry {
  get(id: string): CompilerBackend | undefined;
  resolve(id: string): CompilerBackend;
  list(): readonly string[];
}
