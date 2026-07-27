import type { NextConfig } from "next";
import { PHASE_DEVELOPMENT_SERVER } from "next/constants";

// Security headers applied to every response. Kept conservative on purpose:
// no strict CSP here because the app legitimately embeds third-party frames
// (YouTube/Vimeo), loads media from R2 and talks to Supabase — a wrong CSP
// would break those. These headers are safe and add real hardening.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
];

export default function nextConfig(phase: string): NextConfig {
  const isVercelBuild = process.env.VERCEL === "1";

  return {
    distDir: isVercelBuild
      ? ".next"
      : phase === PHASE_DEVELOPMENT_SERVER
        ? ".next-dev"
        : ".next-prod",
    async headers() {
      return [{ source: "/:path*", headers: securityHeaders }];
    },
  };
}
