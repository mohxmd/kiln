import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  adapterPath: import.meta.resolve("kiln-compiler"),
};

export default nextConfig;
