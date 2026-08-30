import { defineConfig } from "vite-plus";

export default defineConfig({
  lint: {
    ignorePatterns: [
      "node_modules/**",
      "**/node_modules/**",
      "**/.next/**",
      "**/.output/**",
      "**/.svelte-kit/**",
      "**/build/**",
      "**/coverage/**",
      "**/dist/**",
      "examples/with-tanstack/src/routeTree.gen.ts",
      "temp/**",
    ],
    options: {
      typeAware: false,
      typeCheck: false,
    },
  },
  fmt: {
    ignorePatterns: [
      "node_modules/**",
      "**/node_modules/**",
      "**/.next/**",
      "**/.output/**",
      "**/.svelte-kit/**",
      "**/build/**",
      "**/coverage/**",
      "**/dist/**",
      "examples/with-tanstack/src/routeTree.gen.ts",
      "temp/**",
    ],
    singleQuote: false,
    semi: true,
    sortPackageJson: true,
  },
  staged: {
    "*.{js,ts,jsx,tsx,vue,svelte,json,jsonc,css,md}": "vp check --fix",
  },
});
