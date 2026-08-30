import { describe, expect, it } from "bun:test";
import {
  GZ_EMBED_MIN_BYTES,
  isPrunableModuleFile,
  shouldCompressEmbeddedAsset,
} from "../src/core/prune.js";

describe("core/prune", () => {
  describe("isPrunableModuleFile", () => {
    it("prunes sourcemap files", () => {
      expect(isPrunableModuleFile("server/app/page.js.map")).toBe(true);
      expect(isPrunableModuleFile("node_modules/next/dist/index.js.map")).toBe(true);
    });

    it("prunes dev-only React bundles", () => {
      expect(isPrunableModuleFile("react/cjs/react.development.js")).toBe(true);
      expect(isPrunableModuleFile("react-dom/cjs/react-dom.development.js")).toBe(true);
    });

    it("does not apply framework-specific pruning rules", () => {
      expect(isPrunableModuleFile("next/dist/compiled/webpack/bundle5.js")).toBe(false);
      expect(isPrunableModuleFile(".next/node_modules/webpack5/lib/index.js")).toBe(false);
    });

    it("retains production runtime files", () => {
      expect(isPrunableModuleFile("server/app/page.js")).toBe(false);
      expect(isPrunableModuleFile("react/cjs/react.production.min.js")).toBe(false);
      expect(isPrunableModuleFile("node_modules/next/dist/server/next-server.js")).toBe(false);
    });
  });

  describe("shouldCompressEmbeddedAsset", () => {
    it("returns false for non-runtime assets", () => {
      expect(shouldCompressEmbeddedAsset("/_next/static/chunk.js", 10000, 2000)).toBe(false);
      expect(shouldCompressEmbeddedAsset("/public/logo.png", 50000, 10000)).toBe(false);
    });

    it("returns false for small runtime assets below GZ_EMBED_MIN_BYTES", () => {
      expect(
        shouldCompressEmbeddedAsset("__runtime/server/tiny.js", GZ_EMBED_MIN_BYTES - 1, 100),
      ).toBe(false);
    });

    it("returns false for already compressed or binary media formats", () => {
      expect(shouldCompressEmbeddedAsset("__runtime/assets/image.png", 100000, 95000)).toBe(false);
      expect(shouldCompressEmbeddedAsset("__runtime/native/addon.node", 500000, 200000)).toBe(
        false,
      );
      expect(shouldCompressEmbeddedAsset("__runtime/fonts/font.woff2", 50000, 48000)).toBe(false);
    });

    it("returns true for qualifying runtime text files with meaningful compression ratio", () => {
      const rawSize = 50000;
      const gzSize = 12000; // < 90% of raw
      expect(shouldCompressEmbeddedAsset("__runtime/server/chunks/page.js", rawSize, gzSize)).toBe(
        true,
      );
    });
  });
});
