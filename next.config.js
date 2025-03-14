/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: '/run',
  assetPrefix: '/run',
  output: 'standalone',
  trailingSlash: true,
  env: {
    OPENROUTE_API_KEY: process.env.OPENROUTE_API_KEY,
  },
};

module.exports = nextConfig; 