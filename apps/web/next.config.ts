import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

export default function nextConfig(phase: string): NextConfig {
  const isVercelBuild = process.env.VERCEL === "1";

  return {
    distDir: isVercelBuild
      ? ".next"
      : phase === PHASE_DEVELOPMENT_SERVER
        ? ".next-dev"
        : ".next-prod",
  };
}
