/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force rebuild by adding timestamp
  env: {
    BUILD_TIMESTAMP: Date.now().toString(),
  },
  // Ensure Prisma client is properly generated
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client'],
  },
}

module.exports = nextConfig
