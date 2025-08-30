import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

// Determine which database to use based on environment
const isProduction = process.env.NODE_ENV === 'production'
const hasVercelDatabase = !!process.env.DATABASE_URL

// Create Prisma client with appropriate configuration
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      // In production, use the DATABASE_URL if available, otherwise fallback to SQLite
      url: isProduction && hasVercelDatabase 
        ? process.env.DATABASE_URL 
        : 'file:./dev.db',
    },
  },
})

// Only create one instance in development
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

// Database service class with unified interface
export class DatabaseService {
  private prisma: PrismaClient

  constructor() {
    this.prisma = prisma
  }

  // Database health check
  async checkHealth() {
    try {
      await this.prisma.$queryRaw`SELECT 1`
      return { status: 'healthy', timestamp: new Date().toISOString() }
    } catch (error) {
      return { 
        status: 'unhealthy', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString() 
      }
    }
  }

  // Get database info
  async getDatabaseInfo() {
    try {
      if (isProduction && hasVercelDatabase) {
        // PostgreSQL in production
        const result = await this.prisma.$queryRaw`SELECT version() as version`
        return { 
          status: 'connected', 
          info: result,
          database: 'Vercel PostgreSQL',
          timestamp: new Date().toISOString() 
        }
      } else {
        // SQLite in development
        const result = await this.prisma.$queryRaw`SELECT sqlite_version() as version`
        return { 
          status: 'connected', 
          info: result,
          database: 'Local SQLite',
          timestamp: new Date().toISOString() 
        }
      }
    } catch (error) {
      return { 
        status: 'error', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString() 
      }
    }
  }

  // Get Prisma client
  getClient() {
    return this.prisma
  }
}

export default prisma
