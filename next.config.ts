import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // node:sqlite is a Node builtin; keep server code on the Node runtime.
  serverExternalPackages: [],
};

export default nextConfig;
