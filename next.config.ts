import type { NextConfig } from "next";
import withPWAInit from "@ducanh2912/next-pwa";
import path from "path";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
});

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.resolve(__dirname),
  allowedDevOrigins: ["192.168.0.72"],
};

export default withPWA(nextConfig);
