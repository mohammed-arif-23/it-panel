import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: false, // Enable PWA in all environments to prevent stale SW issues
  register: true,
  fallbacks: {
    document: "/offline",
  },
  workboxOptions: {
    disableDevLogs: true,
  },
  // Custom service worker will be created to handle push notifications
  cacheOnFrontEndNav: true,
  reloadOnOnline: true,
});

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['cloudinary'],
  outputFileTracingRoot: __dirname,
};

export default withPWA(nextConfig);
