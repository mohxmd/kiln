/**
 * Generic orchestration for compiling framework output to Bun binary.
 * Auto-detects the framework or uses the explicitly provided one.
 */

import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { detectFramework, getAdapter } from "../adapter/registry.js";
import type { FrameworkAdapter } from "../adapter/types.js";
import type { CompileAppOptions } from "../types.js";
import { logInfo } from "../utils/log.js";
import { compileStandalone } from "./compile-standalone.js";
import { generateEntryPoint } from "./generate-entry-point.js";

export function compileApp(options: CompileAppOptions): {
  outputFile: string;
  standaloneDir: string;
  framework: string;
} {
  const projectDir = resolve(options.projectDir);
  const adapter = resolveAdapter(projectDir, options.framework);

  const distDir = adapter.getDistDir(projectDir);
  const standaloneDir = adapter.getStandaloneDir(projectDir);
  const outputFile = options.outputFile ?? resolve(projectDir, "server");

  if (!existsSync(standaloneDir)) {
    throw new Error(
      `kiln: no standalone output found at ${standaloneDir}. ` +
        `Build your ${adapter.name} app first.`,
    );
  }

  logInfo(`${adapter.name} adapter — standalone: ${standaloneDir}`);

  generateEntryPoint({ standaloneDir, distDir, projectDir, adapter });
  compileStandalone({
    standaloneDir,
    outfile: outputFile,
    extraArgs: options.extraArgs,
    extraDefines: adapter.getBuildDefines(),
  });

  return { outputFile, standaloneDir, framework: adapter.framework };
}

function resolveAdapter(projectDir: string, framework?: string): FrameworkAdapter {
  if (framework) {
    const adapter = getAdapter(framework);
    if (!adapter) {
      throw new Error(
        `kiln: unknown framework "${framework}". No adapter registered.`,
      );
    }
    return adapter;
  }

  const detected = detectFramework(projectDir);
  if (!detected) {
    throw new Error(
      "kiln: could not detect framework. " +
        "Use --framework to specify one explicitly.",
    );
  }

  logInfo(`auto-detected framework: ${detected.name}`);
  return detected;
}
