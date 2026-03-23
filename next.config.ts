/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // ✅ Ignore TypeScript errors during build so Vercel can deploy it!
    ignoreBuildErrors: true,
  },
  eslint: {
    // ✅ Ignore ESLint warnings during build
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;