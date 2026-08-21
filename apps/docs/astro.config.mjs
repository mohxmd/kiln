// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: "Kiln",
      description: "Compile web framework applications into single native Bun executables.",
      social: [
        { icon: "github", label: "GitHub", href: "https://github.com/mohxmd/kiln" },
        { icon: "npm", label: "NPM", href: "https://www.npmjs.com/package/kiln-compiler" },
      ],
      sidebar: [
        {
          label: "Getting Started",
          items: [
            { label: "Introduction", slug: "getting-started/introduction" },
            { label: "Quick Start", slug: "getting-started/quick-start" },
            { label: "How It Works", slug: "getting-started/how-it-works" },
          ],
        },
        {
          label: "Framework Adapters",
          items: [
            { label: "Next.js", slug: "frameworks/nextjs" },
            { label: "Astro", slug: "frameworks/astro" },
            { label: "Roadmap & Others", slug: "frameworks/roadmap" },
          ],
        },
        {
          label: "Guides",
          items: [
            { label: "Runtime Engines", slug: "guides/runtime-engines" },
            { label: "Docker Deployment", slug: "guides/docker" },
            { label: "Cross-Compilation", slug: "guides/cross-compilation" },
            { label: "Runtime Extraction & Cache", slug: "guides/runtime-cache" },
            { label: "Creating Framework Adapters", slug: "guides/creating-adapters" },
          ],
        },
        {
          label: "Reference",
          items: [
            { label: "CLI Reference", slug: "reference/cli" },
            { label: "Environment Variables", slug: "reference/env-vars" },
            { label: "Programmatic API", slug: "reference/api" },
          ],
        },
      ],
    }),
  ],
});