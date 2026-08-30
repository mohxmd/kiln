/**
 * Isolated compiler backend registry.
 */

import { createBunBackend } from "./bun.js";
import { createScriptCBackend } from "./scriptc.js";
import type { BackendRegistry, CompilerBackend } from "./types.js";

export function createBackendRegistry(backends: readonly CompilerBackend[]): BackendRegistry {
  const byId = new Map<string, CompilerBackend>();

  for (const backend of backends) {
    if (!backend.id.trim()) {
      throw new Error("kiln: compiler backend id cannot be empty");
    }
    if (byId.has(backend.id)) {
      throw new Error(`kiln: duplicate compiler backend "${backend.id}"`);
    }
    byId.set(backend.id, backend);
  }

  return {
    get(id) {
      return byId.get(id);
    },
    resolve(id) {
      const backend = byId.get(id);
      if (!backend) {
        const available = [...byId.keys()].join(", ") || "none";
        throw new Error(`kiln: unknown compiler backend "${id}". Available backends: ${available}`);
      }
      return backend;
    },
    list() {
      return [...byId.keys()];
    },
  };
}

export function createDefaultBackendRegistry(): BackendRegistry {
  return createBackendRegistry([createBunBackend(), createScriptCBackend()]);
}
