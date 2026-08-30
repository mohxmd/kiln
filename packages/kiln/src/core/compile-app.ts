/**
 * Main compilation entrypoint for framework applications.
 */

import { existsSync } from "node:fs";
import { join, resolve } from "node:path";

import { detectFramework, getAdapter } from "../adapter/registry.js";
import type { FrameworkAdapter } from "../adapter/types.js";
import { createDefaultBackendRegistry } from "../backend/registry.js";
import { GENERATED_SERVER_ENTRY_FILE } from "../constants.js";
import type { CompileAppOptions, CompileAppResult } from "../types.js";
import { logInfo } from "../utils/log.js";
import { generateEntryPoint } from "./generate-entry-point.js";

export function compileApp(options: CompileAppOptions): CompileAppResult {
  const projectDir = resolve(options.projectDir);
  const adapter = resolveAdapter(projectDir, options.framework);
  const backend = createDefaultBackendRegistry().resolve(options.backend ?? "bun");

  const distDir = adapter.getDistDir(projectDir);
  const standaloneDir = adapter.getStandaloneDir(projectDir);
  const outputFile = options.outputFile ?? resolve(projectDir, "server");
  const engine = options.engine ?? "default";

  if (!existsSync(standaloneDir)) {
    throw new Error(
      `kiln: no standalone output found at ${standaloneDir}. ` +
        `Build your ${adapter.name} app first.`,
    );
  }

  logInfo(
    `${adapter.name} adapter -> ${backend.id} backend -> standalone: ${standaloneDir} (engine: ${engine})`,
  );

  generateEntryPoint({ standaloneDir, distDir, projectDir, adapter, engine });
  backend.compile({
    entrypoint: join(standaloneDir, GENERATED_SERVER_ENTRY_FILE),
    outputFile,
    target: options.target,
    workingDirectory: projectDir,
    extraArgs: options.extraArgs,
    defines: adapter.getBuildDefines(),
  });

  return {
    outputFile,
    standaloneDir,
    framework: adapter.framework,
    backend: backend.id,
  };
}

function resolveAdapter(projectDir: string, framework?: string): FrameworkAdapter {
  if (framework) {
    const adapter = getAdapter(framework);
    if (!adapter) {
      throw new Error(`kiln: unknown framework "${framework}". No adapter registered.`);
    }
    return adapter;
  }

  const detected = detectFramework(projectDir);
  if (!detected) {
    throw new Error(
      "kiln: could not detect framework. " + "Use --framework to specify one explicitly.",
    );
  }

  logInfo(`auto-detected framework: ${detected.name}`);
  return detected;
}
