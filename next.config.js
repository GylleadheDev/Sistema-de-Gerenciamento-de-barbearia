/** @type {import('next').NextConfig} */
const GO_BACKEND_URL = process.env.GO_BACKEND_URL || 'http://localhost:8080'

const nextConfig = {
  compress: true,
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${GO_BACKEND_URL}/api/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
