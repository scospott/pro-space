import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@react-pdf/renderer"],
  // Polices et logo lus sur le disque par la route PDF : à inclure explicitement dans la fonction Vercel.
  outputFileTracingIncludes: {
    "/api/pdf": ["./lib/pdf/fonts/**/*", "./lib/pdf/assets/**/*"],
  },
};

export default nextConfig;
