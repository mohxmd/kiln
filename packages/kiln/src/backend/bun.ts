/**
 * Stable Bun compiler backend.
 */

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";

import { DEFAULT_BUN_BUILD_ARGS, GENERATED_SERVER_ENTRY_FILE } from "../constants.js";
import { logError, logInfo } from "../utils/log.js";
import type { CompileRequest, CompileResult, CompilerBackend } from "./types.js";

export type BunCommandRunner = (
  executable: string,
  args: readonly string[],
  options?: BunCommandOptions,
) => void;

export interface BunCommandOptions {
  readonly cwd?: string;
}

export interface BunBackendOptions {
  /** Injectable command runner for unit tests and embedders. */
  readonly runCommand?: BunCommandRunner;
}

function resolveBunExecutable(): string {
  const bunInstall = process.env.BUN_INSTALL;
  if (bunInstall) {
    const configuredBun = join(bunInstall, "bin", process.platform === "win32" ? "bun.exe" : "bun");
    if (existsSync(configuredBun)) return configuredBun;
  }

  const userBun = join(homedir(), ".bun", "bin", process.platform === "win32" ? "bun.exe" : "bun");
  if (existsSync(userBun)) return userBun;

  return "bun";
}

function runBunCommand(
  executable: string,
  args: readonly string[],
  options?: BunCommandOptions,
): void {
  execFileSync(executable, [...args], {
    stdio: "inherit",
    cwd: options?.cwd,
  });
}

function compileWithBun(request: CompileRequest, runCommand: BunCommandRunner): CompileResult {
  if (!existsSync(request.entrypoint)) {
    throw new Error(`kiln: generated entrypoint not found at ${request.entrypoint}`);
  }

  const defineArgs = (request.defines ?? []).flatMap((define) => ["--define", define]);

  const extraArgs = request.extraArgs ?? [];
  const targetEnv = request.target ?? process.env.KILN_TARGET;
  const hasTargetFlag = extraArgs.some((arg) => arg === "--target" || arg.startsWith("--target="));
  const targetArgs = !hasTargetFlag && targetEnv ? [`--target=${targetEnv}`] : [];

  const args = [
    "build",
    request.entrypoint,
    ...DEFAULT_BUN_BUILD_ARGS,
    ...defineArgs,
    "--outfile",
    request.outputFile,
    ...targetArgs,
    ...extraArgs,
  ];

  const executable = resolveBunExecutable();
  logInfo(`compiling Bun native binary to ${request.outputFile}`);

  try {
    runCommand(executable, args, { cwd: request.workingDirectory });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      logError("`bun` was not found on PATH. Please install it from https://bun.sh and try again.");
      throw new Error("kiln: Bun compiler executable was not found", {
        cause: error,
      });
    }

    const exitCode = (error as { status?: number }).status;
    throw new Error(`bun build failed with exit code ${exitCode ?? "unknown"}`, { cause: error });
  }

  logInfo(`compile completed -> ${request.outputFile}`);
  return { backend: "bun", outputFile: request.outputFile };
}

export function createBunBackend(options: BunBackendOptions = {}): CompilerBackend {
  const runCommand = options.runCommand ?? runBunCommand;

  return {
    id: "bun",
    stability: "stable",
    compile(request) {
      return compileWithBun(request, runCommand);
    },
  };
}

export function getBunEntrypoint(standaloneDir: string): string {
  return join(standaloneDir, GENERATED_SERVER_ENTRY_FILE);
}
