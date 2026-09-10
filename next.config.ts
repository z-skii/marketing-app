import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Development only: Next blocks cross-origin requests to /_next/* dev
  // resources, which breaks hydration when the app is opened on a loopback
  // address other than the one it was started on (browser automation, devices
  // on the LAN). Has no effect on a production build.
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  // The dev badge lands on a bottom-bar tab or a top-strip icon at every
  // position on a phone. Errors still surface with it off.
  devIndicators: false,
};

export default nextConfig;
