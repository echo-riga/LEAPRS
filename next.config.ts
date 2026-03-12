import type { NextConfig } from "next";

const NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb", // adjust as needed
    },
  },
};

export default NextConfig;
