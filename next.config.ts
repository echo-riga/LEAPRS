import type { NextConfig } from "next";

const NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb", // adjust as needed
    },
  },
};

export default NextConfig;
