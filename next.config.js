/** @type {import('next').NextConfig} */
const isProdExport = process.env.NEXT_EXPORT === 'true'
const GO_BACKEND_URL = process.env.GO_BACKEND_URL || 'http://localhost:8080'

const nextConfig = {
  ...(isProdExport ? { output: 'export' } : {}),
  compress: true,
  poweredByHeader: false,
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  ...(!isProdExport
    ? {
        async rewrites() {
          return [
            {
              source: '/api/:path*',
              destination: `${GO_BACKEND_URL}/api/:path*`,
            },
          ]
        },
      }
    : {}),
}

module.exports = nextConfig
