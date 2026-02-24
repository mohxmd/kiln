/**
 * Framework adapter registry with auto-detection support.
 */

import type {
  FrameworkAdapter,
  FrameworkAdapterRegistration,
} from "./types.js";

const registry = new Map<string, FrameworkAdapterRegistration>();

export function registerAdapter(
  registration: FrameworkAdapterRegistration,
): void {
  registry.set(registration.framework, registration);
}

export function getAdapter(framework: string): FrameworkAdapter | undefined {
  const reg = registry.get(framework);
  return reg?.create();
}

export function detectFramework(
  projectDir: string,
): FrameworkAdapter | undefined {
  for (const reg of registry.values()) {
    const adapter = reg.create();
    if (adapter.detect(projectDir)) return adapter;
  }
  return undefined;
}

export function listAdapters(): string[] {
  return [...registry.keys()];
}
