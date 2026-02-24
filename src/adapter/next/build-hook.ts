/**
 * Next.js build adapter that hooks into `next build` via experimental.adapterPath.
 *
 * This is the module loaded by Next when you set:
 *   experimental: { adapterPath: import.meta.resolve("kiln") }
 */

import { writeBuildContext } from "../../core/build-context.js";
import { logWarn } from "../../utils/log.js";
import { KNOWN_TRANSPILE_PACKAGES } from "./constants.js";

interface AdapterContext {
  phase: string;
}

interface NextLikeConfig {
  output?: string;
  transpilePackages?: string[];
  assetPrefix?: string;
  nextRuntimeCompiler?: {
    transpilePackages?: string[];
  };
}

interface OnBuildCompleteContext {
  distDir: string;
  projectDir: string;
  config: NextLikeConfig;
}

export interface NextBuildHook {
  name: string;
  modifyConfig: (
    config: NextLikeConfig,
    context?: AdapterContext,
  ) => NextLikeConfig;
  onBuildComplete: (context: OnBuildCompleteContext) => Promise<void>;
}

function parseEnvTranspilePackages(): string[] {
  const raw = process.env.NEXT_RUNTIME_COMPILER_TRANSPILE_PACKAGES;
  if (!raw) return [];
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function mergeTranspilePackages(config: NextLikeConfig): string[] {
  const existing = config.transpilePackages ?? [];
  const fromConfig = config.nextRuntimeCompiler?.transpilePackages ?? [];
  const fromEnv = parseEnvTranspilePackages();
  return [
    ...new Set([
      ...existing,
      ...KNOWN_TRANSPILE_PACKAGES,
      ...fromConfig,
      ...fromEnv,
    ]),
  ];
}

export function createNextBuildHook(): NextBuildHook {
  return {
    name: "kiln/next",

    modifyConfig(config, context) {
      if (!context) {
        throw new Error(
          "kiln: Next 16+ build adapter context is required.",
        );
      }

      if (context.phase !== "phase-production-build") return config;

      if (process.argv.includes("--webpack")) {
        throw new Error(
          "kiln: webpack mode is not supported. Use Turbopack build.",
        );
      }

      if (config.output !== "standalone") {
        logWarn('forcing Next output="standalone" for runtime compilation');
        config.output = "standalone";
      }

      config.transpilePackages = mergeTranspilePackages(config);

      return config;
    },

    async onBuildComplete(context) {
      writeBuildContext(
        context.distDir,
        context.projectDir,
        context.config.assetPrefix ?? "",
      );
    },
  };
}
