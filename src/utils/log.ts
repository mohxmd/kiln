/**
 * Minimal logger with package-prefixed messages.
 */

const PREFIX = "kiln";

export function logInfo(message: string): void {
  console.log(`${PREFIX}: ${message}`);
}

export function logWarn(message: string): void {
  console.warn(`${PREFIX}: ${message}`);
}

export function logError(message: string): void {
  console.error(`${PREFIX}: ${message}`);
}
