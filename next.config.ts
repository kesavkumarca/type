import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 🚀 Tell Next.js to NOT bundle these messy PDF libraries
  serverExternalPackages: ["pdf-parse-fork"], 
};

export default nextConfig;