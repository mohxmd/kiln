/**
 * Next.js-specific build constants.
 */

import type { StubModule } from "../types.js";

export const KNOWN_TRANSPILE_PACKAGES = ["pino", "pino-pretty"] as const;

export const NEXT_BUILD_DEFINES: readonly string[] = [
  "process.env.TURBOPACK=1",
  "process.env.__NEXT_EXPERIMENTAL_REACT=",
  'process.env.NEXT_RUNTIME="nodejs"',
];

export const NEXT_STUB_MODULES: readonly StubModule[] = [
  {
    path: "node_modules/next/dist/server/dev/next-dev-server.js",
    content: "module.exports = { default: null };",
  },
  {
    path: "node_modules/next/dist/server/lib/router-utils/setup-dev-bundler.js",
    content: "module.exports = {};",
  },
  {
    path: "node_modules/@opentelemetry/api/index.js",
    content: "throw new Error('not installed');",
  },
  {
    path: "node_modules/critters/index.js",
    content: "module.exports = {};",
  },
];
