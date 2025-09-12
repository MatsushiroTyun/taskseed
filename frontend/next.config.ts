import type { NextConfig } from "next";
import path from "path";
import dotenv from "dotenv";

// プロジェクトルートの .env を読む
dotenv.config({ path: path.join(__dirname, "..", ".env") });

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
};

export default nextConfig;
