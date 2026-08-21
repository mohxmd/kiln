import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    adapterPath: import.meta.resolve("kiln-compiler"),
  },
};

export default nextConfig;
