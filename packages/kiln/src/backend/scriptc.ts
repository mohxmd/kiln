/**
 * Experimental ScriptC compiler backend.
 *
 * ScriptC is invoked as an external compiler. Its target is configured with
 * SCRIPTC_TARGET rather than Bun's --target flag. WASI is deliberately
 * rejected here until Kiln's generated runtime no longer depends on Bun's
 * HTTP and filesystem APIs.
 */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

import { logError, logInfo } from "../utils/log.js";
import type {
  CompileRequest,
  CompileResult,
  CompilerBackend,
} from "./types.js";

export interface ScriptCCommandOptions {
  readonly cwd?: string;
  readonly env?: NodeJS.ProcessEnv;
}

export type ScriptCCommandRunner = (
  executable: string,
  args: readonly string[],
  options?: ScriptCCommandOptions,
) => void;

export interface ScriptCBackendOptions {
  /** Injectable command runner for unit tests and embedders. */
  readonly runCommand?: ScriptCCommandRunner;
}

function resolveScriptCExecutable(workingDirectory?: string): string {
  const configured = process.env.KILN_SCRIPTC_BIN;
  if (configured) return configured;

  const executableName =
    process.platform === "win32" ? "scriptc.cmd" : "scriptc";
  const searchDirectories = [workingDirectory, process.cwd()].filter(
    (directory, index, directories): directory is string =>
      directory !== undefined && directories.indexOf(directory) === index,
  );

  for (const directory of searchDirectories) {
    const local = join(directory, "node_modules", ".bin", executableName);
    if (existsSync(local)) return local;
  }

  return "scriptc";
}

function runScriptCCommand(
  executable: string,
  args: readonly string[],
  options?: ScriptCCommandOptions,
): void {
  execFileSync(executable, [...args], {
    stdio: "inherit",
    cwd: options?.cwd,
    env: options?.env,
  });
}

function compileWithScriptC(
  request: CompileRequest,
  runCommand: ScriptCCommandRunner,
): CompileResult {
  if (!existsSync(request.entrypoint)) {
    throw new Error(
      `kiln: generated entrypoint not found at ${request.entrypoint}`,
    );
  }

  const target = request.target ?? process.env.SCRIPTC_TARGET;
  if (target === "wasm32-wasi") {
    throw new Error(
      "kiln: ScriptC WASI output is not supported yet; the generated Kiln runtime requires a portable HTTP host",
    );
  }

  const defines = request.defines ?? [];
  if (defines.length > 0) {
    throw new Error(
      "kiln: the ScriptC backend does not support adapter build defines yet",
    );
  }

  const args = [
    "build",
    request.entrypoint,
    "--emit=exe",
    "--out",
    request.outputFile,
    ...(request.extraArgs ?? []),
  ];
  const env = { ...process.env };
  if (request.target) env.SCRIPTC_TARGET = request.target;

  const executable = resolveScriptCExecutable(request.workingDirectory);
  logInfo(`compiling ScriptC native binary to ${request.outputFile}`);

  try {
    runCommand(executable, args, {
      cwd: request.workingDirectory,
      env,
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      logError(
        "`scriptc` was not found. Install ScriptC or set KILN_SCRIPTC_BIN to its executable path.",
      );
      throw new Error("kiln: ScriptC compiler executable was not found", {
        cause: error,
      });
    }

    const exitCode = (error as { status?: number }).status;
    throw new Error(
      `scriptc build failed with exit code ${exitCode ?? "unknown"}`,
      { cause: error },
    );
  }

  logInfo(`compile completed -> ${request.outputFile}`);
  return { backend: "scriptc", outputFile: request.outputFile };
}

export function createScriptCBackend(
  options: ScriptCBackendOptions = {},
): CompilerBackend {
  const runCommand = options.runCommand ?? runScriptCCommand;

  return {
    id: "scriptc",
    stability: "experimental",
    compile(request) {
      return compileWithScriptC(request, runCommand);
    },
  };
}
