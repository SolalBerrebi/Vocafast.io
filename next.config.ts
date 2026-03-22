import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: false,
  },
  excludeDefaultMomentLocales: true,
};

export default nextConfig;
