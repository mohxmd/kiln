/**
 * Generates the runtime Module._resolveFilename fallback hook code string.
 *
 * This hook runs at runtime when Bun's compiled binary resolver cannot find a
 * bare specifier from inside extracted node_modules, and redirects mangled
 * Turbopack aliases to canonical packages.
 */

export function generateResolverHookSource(
  aliases: Record<string, string>,
  _runtimeBaseDir: string = "baseDir",
): string {
  return `// Fallback Module._resolveFilename hook for compiled binary node_modules resolution
const __kilnAliases = ${JSON.stringify(aliases)};
const __kilnOrigResolveFilename = Module._resolveFilename;

function __kilnStatFile(p) {
  try { return fs.statSync(p).isFile() ? p : null; } catch { return null; }
}

function __kilnResolveMain(pkgDir, pkgJson) {
  const main = pkgJson && typeof pkgJson.main === "string" ? pkgJson.main : "index.js";
  return __kilnStatFile(path.normalize(path.join(pkgDir, main)))
    || __kilnStatFile(path.normalize(path.join(pkgDir, main + ".js")))
    || __kilnStatFile(path.normalize(path.join(pkgDir, main + ".cjs")))
    || __kilnStatFile(path.normalize(path.join(pkgDir, main + ".mjs")))
    || __kilnStatFile(path.normalize(path.join(pkgDir, main, "index.js")))
    || __kilnStatFile(path.normalize(path.join(pkgDir, "index.js")))
    || __kilnStatFile(path.normalize(path.join(pkgDir, "index.cjs")));
}

function __kilnResolveSubpath(pkgDir, pkgJson, sub) {
  if (pkgJson && pkgJson.exports && typeof pkgJson.exports === "object") {
    const key = "./" + sub;
    const entry = pkgJson.exports[key];
    if (entry) {
      const target = typeof entry === "string" ? entry : (entry.require || entry.node || entry.default);
      if (typeof target === "string" && target.startsWith("./")) {
        const f = __kilnStatFile(path.normalize(path.join(pkgDir, target.slice(2))));
        if (f) return f;
      }
    }
  }
  const direct = __kilnStatFile(path.normalize(path.join(pkgDir, sub)))
    || __kilnStatFile(path.normalize(path.join(pkgDir, sub + ".js")))
    || __kilnStatFile(path.normalize(path.join(pkgDir, sub + ".cjs")))
    || __kilnStatFile(path.normalize(path.join(pkgDir, sub + ".mjs")))
    || __kilnStatFile(path.normalize(path.join(pkgDir, sub + ".json")));
  if (direct) return direct;

  const subDir = path.join(pkgDir, sub);
  try {
    if (fs.statSync(subDir).isDirectory()) {
      const subPkgPath = path.join(subDir, "package.json");
      if (fs.existsSync(subPkgPath)) {
        try {
          const subPkg = JSON.parse(fs.readFileSync(subPkgPath, "utf-8"));
          const main = typeof subPkg.main === "string" ? subPkg.main : null;
          if (main) {
            const f = __kilnStatFile(path.normalize(path.join(subDir, main)))
              || __kilnStatFile(path.normalize(path.join(subDir, main + ".js")))
              || __kilnStatFile(path.normalize(path.join(subDir, main + ".cjs")));
            if (f) return f;
          }
        } catch {}
      }
    }
  } catch {}
  return __kilnStatFile(path.normalize(path.join(pkgDir, sub, "index.js")))
    || __kilnStatFile(path.normalize(path.join(pkgDir, sub, "index.cjs")));
}

function __kilnCheckPkgDir(pkgDir, sub) {
  if (!fs.existsSync(pkgDir)) return null;
  let pkgJson = null;
  const pkgJsonPath = path.join(pkgDir, "package.json");
  if (fs.existsSync(pkgJsonPath)) {
    try { pkgJson = JSON.parse(fs.readFileSync(pkgJsonPath, "utf-8")); } catch {}
  }
  return sub ? __kilnResolveSubpath(pkgDir, pkgJson, sub) : __kilnResolveMain(pkgDir, pkgJson);
}

function __kilnResolvePackageInDir(pkgName, sub, rootDir) {
  let dir = rootDir;
  while (dir && dir.length > 1) {
    const nm = path.join(dir, "node_modules");
    if (fs.existsSync(nm)) {
      // 1. Direct standard node_modules/pkgName
      let res = __kilnCheckPkgDir(path.join(nm, pkgName), sub);
      if (res) return res;

      // 2. pnpm shared node_modules/.pnpm/node_modules/pkgName
      res = __kilnCheckPkgDir(path.join(nm, ".pnpm", "node_modules", pkgName), sub);
      if (res) return res;

      // 3. Bun shared node_modules/.bun/node_modules/pkgName
      res = __kilnCheckPkgDir(path.join(nm, ".bun", "node_modules", pkgName), sub);
      if (res) return res;

      // 4. Search in .bun and .pnpm virtual store package folders
      for (const store of [".bun", ".pnpm"]) {
        const storeDir = path.join(nm, store);
        if (fs.existsSync(storeDir)) {
          try {
            const entries = fs.readdirSync(storeDir);
            for (const entry of entries) {
              const nested = path.join(storeDir, entry, "node_modules", pkgName);
              res = __kilnCheckPkgDir(nested, sub);
              if (res) return res;
            }
          } catch {}
        }
      }
    }
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return null;
}

function __kilnResolvePackage(request, fromDir) {
  let pkgName, sub = "";
  if (request[0] === "@") {
    const m = request.match(/^(@[^/]+\\/[^/]+)(?:\\/(.+))?$/);
    if (!m) return null;
    pkgName = m[1]; sub = m[2] || "";
  } else {
    const idx = request.indexOf("/");
    if (idx === -1) { pkgName = request; }
    else { pkgName = request.slice(0, idx); sub = request.slice(idx + 1); }
  }

  // 1. Search upwards from requiring directory
  if (fromDir) {
    const found = __kilnResolvePackageInDir(pkgName, sub, fromDir);
    if (found) return found;
  }

  // 2. Search upwards from extracted baseDir
  const baseFound = __kilnResolvePackageInDir(pkgName, sub, baseDir);
  if (baseFound) return baseFound;

  return null;
}

function __kilnRedirectAlias(request) {
  if (typeof request !== "string" || request.length === 0) return request;
  if (Object.prototype.hasOwnProperty.call(__kilnAliases, request)) {
    return __kilnAliases[request];
  }
  const slash = request.indexOf("/", request[0] === "@" ? request.indexOf("/") + 1 : 0);
  if (slash === -1) return request;
  const head = request.slice(0, slash);
  if (Object.prototype.hasOwnProperty.call(__kilnAliases, head)) {
    return __kilnAliases[head] + request.slice(slash);
  }
  return request;
}

Module._resolveFilename = function(request, parent, isMain, options) {
  const redirected = __kilnRedirectAlias(request);
  try {
    return __kilnOrigResolveFilename.call(this, redirected, parent, isMain, options);
  } catch (err) {
    if (typeof redirected !== "string" || redirected[0] === "." || redirected[0] === "/" || /^[a-z]+:/.test(redirected)) {
      throw err;
    }
    const fromDir = parent && parent.filename ? path.dirname(parent.filename) : process.cwd();
    const resolved = __kilnResolvePackage(redirected, fromDir);
    if (resolved) return resolved;
    throw err;
  }
};
`;
}