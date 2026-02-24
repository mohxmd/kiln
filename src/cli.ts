#!/usr/bin/env node

/**
 * CLI entrypoint for compiling framework app output into a Bun binary.
 */

import { resolve } from "node:path";

import { listAdapters } from "./adapter/registry.js";
import { compileApp } from "./core/compile-app.js";
import { logError, logInfo } from "./utils/log.js";

function parseArgs(argv: string[]): {
  projectDir: string;
  outputFile?: string;
  framework?: string;
  extraArgs: string[];
} {
  let projectDir = ".";
  let outputFile: string | undefined;
  let framework: string | undefined;
  const extraArgs: string[] = [];

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg) continue;

    if (arg === "--project" || arg === "-p") {
      projectDir = argv[i + 1] ?? ".";
      i += 1;
      continue;
    }
    if (arg === "--out" || arg === "-o") {
      outputFile = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--framework" || arg === "-f") {
      framework = argv[i + 1];
      i += 1;
      continue;
    }
    if (arg === "--list-adapters") {
      const adapters = listAdapters();
      console.log(`Available adapters: ${adapters.join(", ") || "(none)"}`);
      process.exit(0);
    }
    extraArgs.push(arg);
  }

  return { projectDir: resolve(projectDir), outputFile, framework, extraArgs };
}

function main(): void {
  try {
    const parsed = parseArgs(process.argv.slice(2));
    const result = compileApp({
      projectDir: parsed.projectDir,
      outputFile: parsed.outputFile,
      framework: parsed.framework,
      extraArgs: parsed.extraArgs,
    });
    logInfo(`binary ready at ${result.outputFile} (${result.framework})`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "unknown compiler failure";
    logError(message);
    process.exit(1);
  }
}

main();
