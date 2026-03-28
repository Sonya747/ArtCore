import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  /** 避免 Turbopack 打包七牛 Node SDK 时解析 urllib → proxy-agent 失败 */
  serverExternalPackages: ["qiniu", "urllib", "proxy-agent"],
  turbopack:{
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  }
}

export default nextConfig