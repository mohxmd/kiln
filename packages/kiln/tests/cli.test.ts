import { describe, expect, it } from "bun:test";
import { resolve } from "node:path";

import { parseArgs } from "../src/cli.js";

describe("cli", () => {
  it("parses compiler options and forwards only arguments after --", () => {
    const options = parseArgs([
      "--project",
      "./example",
      "--out",
      "./bin/server",
      "--framework",
      "next",
      "--backend",
      "bun",
      "--engine",
      "bun-serve",
      "--target",
      "bun-linux-x64",
      "--",
      "--minify",
      "--external",
      "sharp",
    ]);

    expect(options).toEqual({
      projectDir: resolve("./example"),
      outputFile: "./bin/server",
      framework: "next",
      backend: "bun",
      engine: "bun-serve",
      target: "bun-linux-x64",
      extraArgs: ["--minify", "--external", "sharp"],
    });
  });
});
