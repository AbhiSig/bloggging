const nextConfig = {
  images: {
    unoptimized: process.env.NODE_ENV === "development", // ✅ bypasses private IP check in dev
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "8000",
        pathname: "/uploads/**",
      },
    ],
  },
}

module.exports = nextConfig