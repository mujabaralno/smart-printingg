import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Production Prisma client for Vercel
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Only create one instance
if (process.env.NODE_ENV === 'production') globalForPrisma.prisma = prisma;

// Database connection health check
export async function checkDatabaseConnection() {
  if (!process.env.DATABASE_URL) {
    return { 
      status: 'failed', 
      error: 'DATABASE_URL not configured',
      timestamp: new Date().toISOString() 
    };
  }
  
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { 
      status: 'connected', 
      timestamp: new Date().toISOString(),
      database: 'Vercel PostgreSQL'
    };
  } catch (error) {
    console.error('Database connection failed:', error);
    return { 
      status: 'failed', 
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString() 
    };
  }
}

// Graceful shutdown
export async function closeDatabaseConnection() {
  if (prisma) {
    try {
      await prisma.$disconnect();
      console.log('Database connection closed gracefully');
    } catch (error) {
      console.error('Error closing database connection:', error);
    }
  }
}

export default prisma;
