import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Use "standalone" for Docker self-hosting; omit for Vercel deployment.
  // Vercel auto-detects Next.js and handles the build output natively.
  ...(process.env.VERCEL ? {} : { output: "standalone" }),
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;
