/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'bcryptjs']
  },
  // Otimizações para produção
  compress: true,
  poweredByHeader: false,
  // Configurações específicas para Vercel
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  // Evitar problemas com pre-rendering de rotas de API
  generateBuildId: async () => {
    return 'build-' + Date.now()
  }
}

module.exports = nextConfig
