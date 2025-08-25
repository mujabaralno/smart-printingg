/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force rebuild by adding timestamp
  env: {
    BUILD_TIMESTAMP: Date.now().toString(),
  },
  // Ensure Prisma client is properly generated
  serverExternalPackages: ['@prisma/client'],
}

module.exports = nextConfig
