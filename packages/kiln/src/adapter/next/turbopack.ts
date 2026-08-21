/**
 * Turbopack mangled alias scanning, canonical resolution, and chunk rewriting.
 */

import {
  existsSync,
  lstatSync,
  readFileSync,
  readdirSync,
  realpathSync,
  statSync,
  writeFileSync,
} from "node:fs";
import { basename, join } from "node:path";

import { findPackageDirs, walkDir } from "../../utils/fs.js";
import { logInfo, logWarn } from "../../utils/log.js";

export interface TurbopackAlias {
  alias: string;
  target: string;
  subpaths: string[];
}

/**
 * Next.js with Turbopack rewrites externalized requires to mangled names
 * like `require("sharp-457ea9eae1af1a9c")`.
 * We discover them by scanning chunks for `"<name>-<16 hex>[/<subpath>]"`.
 */
export function findTurbopackAliases(standaloneNextDir: string): TurbopackAlias[] {
  const seen = new Map<string, { target: string; subpaths: Set<string> }>();

  const ensure = (alias: string) => {
    let e = seen.get(alias);
    if (!e) {
      e = { target: alias.replace(/-[0-9a-f]{16}$/, ""), subpaths: new Set() };
      seen.set(alias, e);
    }
    return e;
  };

  const serverDir = join(standaloneNextDir, "server");
  if (existsSync(serverDir)) {
    for (const f of walkDir(serverDir)) {
      if (!f.absolutePath.endsWith(".js")) continue;
      let content: string;
      try {
        content = readFileSync(f.absolutePath, "utf-8");
      } catch {
        continue;
      }
      const re = /["']([^"'\s/]+-[0-9a-f]{16})(?:\/([^"'\s]+))?["']/g;
      let m;
      while ((m = re.exec(content))) {
        const entry = ensure(m[1] as string);
        if (m[2]) entry.subpaths.add(m[2]);
      }
    }
  }

  const nodeModulesDir = join(standaloneNextDir, "node_modules");
  if (existsSync(nodeModulesDir)) {
    for (const name of readdirSync(nodeModulesDir)) {
      if (!/-[0-9a-f]{16}$/.test(name)) continue;
      if (seen.has(name)) continue;
      const aliasPath = join(nodeModulesDir, name);
      try {
        if (!lstatSync(aliasPath).isSymbolicLink()) continue;
        seen.set(name, {
          target: basename(realpathSync(aliasPath)),
          subpaths: new Set(),
        });
      } catch {
        continue;
      }
    }
  }

  return Array.from(seen, ([alias, { target, subpaths }]) => ({
    alias,
    target,
    subpaths: Array.from(subpaths),
  }));
}

/**
 * Map each alias/subpath to its canonical disk file.
 */
export function buildCanonicalResolutions(
  externalRoot: string,
  aliases: TurbopackAlias[],
): Map<string, string> {
  const out = new Map<string, string>();

  const findFile = (dir: string, candidates: string[]): string | null => {
    for (const c of candidates) {
      if (!c) continue;
      const p = join(dir, c);
      if (existsSync(p) && statSync(p).isFile()) return c.replace(/\\/g, "/");
    }
    return null;
  };

  const resolveMain = (canonicalDir: string): string | null => {
    const pkgPath = join(canonicalDir, "package.json");
    let main = "index.js";
    if (existsSync(pkgPath)) {
      try {
        const pkg = JSON.parse(readFileSync(pkgPath, "utf-8"));
        if (typeof pkg.main === "string") main = pkg.main;
      } catch {}
    }
    return findFile(canonicalDir, [
      main,
      main + ".js",
      main + ".cjs",
      main + ".mjs",
      join(main, "index.js"),
      join(main, "index.cjs"),
      join(main, "index.mjs"),
      "index.js",
      "index.cjs",
      "index.mjs",
    ]);
  };

  const resolveSub = (canonicalDir: string, sub: string): string | null => {
    const stripped = sub.replace(/\.(?:js|cjs|mjs|json)$/, "");
    return findFile(canonicalDir, [
      sub,
      stripped + ".mjs",
      stripped + ".js",
      stripped + ".cjs",
      stripped + ".json",
      join(stripped, "index.mjs"),
      join(stripped, "index.js"),
      join(stripped, "index.cjs"),
    ]);
  };

  for (const { alias, target, subpaths } of aliases) {
    const canonicalDir = join(externalRoot, target);
    if (!existsSync(canonicalDir)) continue;
    const main = resolveMain(canonicalDir);
    if (main) out.set(alias, `.next/node_modules/${target}/${main}`);
    for (const sub of subpaths) {
      const file = resolveSub(canonicalDir, sub);
      if (file) out.set(`${alias}/${sub}`, `.next/node_modules/${target}/${file}`);
    }
  }

  return out;
}

/**
 * Validate that every found alias has a corresponding resolved file.
 */
export function validateAliasResolutions(
  aliases: TurbopackAlias[],
  resolutions: Map<string, string>,
): void {
  const unresolved: string[] = [];

  for (const { alias, target, subpaths } of aliases) {
    if (!resolutions.has(alias)) unresolved.push(`${alias} -> ${target}`);
    for (const sub of subpaths) {
      const ref = `${alias}/${sub}`;
      if (!resolutions.has(ref)) unresolved.push(`${ref} -> ${target}/${sub}`);
    }
  }

  if (unresolved.length > 0) {
    logWarn(
      `${unresolved.length} Turbopack alias references could not be statically resolved:`,
    );
    for (const ref of unresolved) {
      logWarn(`  - ${ref}`);
    }
  }
}

/**
 * Rewrite chunks in-place with `__KILN_BASE__` placeholders.
 */
export function rewriteTurbopackAliases(
  standaloneNextDir: string,
  aliases: TurbopackAlias[],
  resolutions: Map<string, string>,
): string[] {
  const rewrittenPaths: string[] = [];
  if (aliases.length === 0 || resolutions.size === 0) return rewrittenPaths;

  const serverDir = join(standaloneNextDir, "server");
  if (!existsSync(serverDir)) return rewrittenPaths;

  const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    "([\"'])((?:" +
      aliases.map((a) => escape(a.alias)).join("|") +
      ")(?:/[^\"']+)?)\\1",
    "g",
  );

  for (const f of walkDir(serverDir)) {
    if (!f.absolutePath.endsWith(".js")) continue;
    let content: string;
    try {
      content = readFileSync(f.absolutePath, "utf-8");
    } catch {
      continue;
    }

    const next = content.replace(pattern, (match, quote, spec) => {
      const rel = resolutions.get(spec);
      if (!rel) return match;
      return `${quote}__KILN_BASE__/${rel}${quote}`;
    });

    if (next !== content) {
      writeFileSync(f.absolutePath, next);
      rewrittenPaths.push(`.next/server/${f.relativePath.replace(/\\/g, "/")}`);
    }
  }

  if (rewrittenPaths.length > 0) {
    logInfo(
      `rewrote ${rewrittenPaths.length} server chunks for Turbopack alias compatibility`,
    );
  }

  return rewrittenPaths;
}

/**
 * Patch require-hook.js in Next.js so require.resolve calls don't throw in compiled binaries.
 */
export function patchRequireHook(standaloneDir: string): void {
  const nextDirs = findPackageDirs(standaloneDir, "next");
  const target =
    "let resolve = process.env.NEXT_MINIMAL ? __non_webpack_require__.resolve : require.resolve;";
  const replacement =
    "let _resolve = process.env.NEXT_MINIMAL ? __non_webpack_require__.resolve : require.resolve;\nlet resolve = (id) => { try { return _resolve(id); } catch { return ''; } };";

  let patched = 0;
  for (const nextDir of nextDirs) {
    const hookPath = join(nextDir, "dist/server/require-hook.js");
    if (!existsSync(hookPath)) continue;

    let content = readFileSync(hookPath, "utf-8");
    if (!content.includes(target)) continue;

    content = content.replace(target, replacement);
    writeFileSync(hookPath, content);
    patched += 1;
  }

  if (patched > 0) {
    logInfo("patched Next.js require-hook.js for compiled binary compatibility");
  }
}
