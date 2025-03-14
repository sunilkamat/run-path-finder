/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  basePath: '/run',
  assetPrefix: '/run',
  output: 'standalone',
  trailingSlash: true,
};

module.exports = nextConfig; 