/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: __dirname,
  },
  async rewrites() {
    return [
      {
        source: '/api/backend/:path*',
        destination: 'http://localhost:3001/:path*',
      },
    ];
  },
  images: {
    domains: [],
    formats: ['image/avif', 'image/webp'],
  },
}

module.exports = nextConfig

