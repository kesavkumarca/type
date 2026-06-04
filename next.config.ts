import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 🚀 Tell Next.js to NOT bundle these messy PDF libraries
  serverExternalPackages: ["pdf-parse-fork"],
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
