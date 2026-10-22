import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "cloth-flu-maintaining-acting.trycloudflare.com",
    "fiber-val-personnel-dui.trycloudflare.com",
    "*.trycloudflare.com",
    "trycloudflare.com",
    "*.ngrok-free.app",
    "*.ngrok-free.dev",
    "recast-landmass-sedan.ngrok-free.dev",
    "localhost:3000",
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "image.pollinations.ai",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "gen.pollinations.ai",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "media.pollinations.ai",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
