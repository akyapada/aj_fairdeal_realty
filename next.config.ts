import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;

// Lets `npm run dev` use real Cloudflare bindings (env vars, etc.) instead
// of guessing at them — no effect on the production build.
initOpenNextCloudflareForDev();
