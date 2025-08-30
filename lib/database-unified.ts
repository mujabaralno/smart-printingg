import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Determine which database to use based on environment
const isProduction = process.env.NODE_ENV === 'production';
const hasVercelDatabase = !!process.env.DATABASE_URL;

// Create Prisma client with appropriate configuration
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL || 'file:./prisma/dev.db',
    },
  },
});

// Only create one instance in development
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Database service class with unified interface
export class DatabaseService {
  // Helper method to check if database is available
  private static checkDatabase() {
    if (!prisma) {
      throw new Error('Database not available - DATABASE_URL not configured');
    }
    return prisma;
  }

  // Helper method to get database info
  static getDatabaseInfo() {
    return {
      isProduction,
      hasVercelDatabase,
      databaseUrl: process.env.DATABASE_URL ? 'Vercel PostgreSQL' : 'Local SQLite',
      environment: process.env.NODE_ENV || 'development'
    };
  }

  // Database connection health check
  static async checkConnection() {
    try {
      const db = this.checkDatabase();
      await db.$queryRaw`SELECT 1`;
      return { 
        status: 'connected', 
        timestamp: new Date().toISOString(),
        ...this.getDatabaseInfo()
      };
    } catch (error) {
      console.error('Database connection failed:', error);
      return { 
        status: 'failed', 
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        ...this.getDatabaseInfo()
      };
    }
  }

  // Graceful shutdown
  static async disconnect() {
    if (prisma) {
      try {
        await prisma.$disconnect();
        console.log('Database connection closed gracefully');
      } catch (error) {
        console.error('Error closing database connection:', error);
      }
    }
  }

  // User operations
  static async createUser(userData: {
    email: string;
    name: string;
    role?: string;
    profilePicture?: string;
    password?: string;
    status?: string;
  }) {
    const db = this.checkDatabase();
    return await db.user.create({
      data: userData,
    });
  }

  static async getUserByEmail(email: string) {
    const db = this.checkDatabase();
    return await db.user.findUnique({
      where: { email },
    });
  }

  static async getUserById(id: string) {
    const db = this.checkDatabase();
    return await db.user.findUnique({
      where: { id },
    });
  }

  static async getAllUsers() {
    const db = this.checkDatabase();
    return await db.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  static async updateUser(id: string, userData: any) {
    const db = this.checkDatabase();
    return await db.user.update({
      where: { id },
      data: userData,
    });
  }

  static async deleteUser(id: string) {
    const db = this.checkDatabase();
    return await db.user.delete({
      where: { id },
    });
  }

  // Client operations
  static async createClient(clientData: any) {
    const db = this.checkDatabase();
    return await db.client.create({
      data: clientData,
    });
  }

  static async getClientById(id: string) {
    const db = this.checkDatabase();
    return await db.client.findUnique({
      where: { id },
    });
  }

  static async getAllClients() {
    const db = this.checkDatabase();
    return await db.client.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  static async updateClient(id: string, clientData: any) {
    const db = this.checkDatabase();
    return await db.client.update({
      where: { id },
      data: clientData,
    });
  }

  static async deleteClient(id: string) {
    const db = this.checkDatabase();
    return await db.client.delete({
      where: { id },
    });
  }

  // Quote operations
  static async createQuote(quoteData: any) {
    const db = this.checkDatabase();
    return await db.quote.create({
      data: quoteData,
    });
  }

  static async getQuoteById(id: string) {
    const db = this.checkDatabase();
    return await db.quote.findUnique({
      where: { id },
      include: {
        user: true,
        client: true,
        finishing: true,
        papers: true,
        amounts: true,
      },
    });
  }

  static async getAllQuotes() {
    const db = this.checkDatabase();
    return await db.quote.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true
          }
        },
        finishing: true,
        papers: true
      }
    });
  }

  static async updateQuote(id: string, quoteData: any) {
    const db = this.checkDatabase();
    return await db.quote.update({
      where: { id },
      data: quoteData,
    });
  }

  static async deleteQuote(id: string) {
    const db = this.checkDatabase();
    return await db.quote.delete({
      where: { id },
    });
  }

  // Supplier operations
  static async createSupplier(supplierData: any) {
    const db = this.checkDatabase();
    return await db.supplier.create({
      data: supplierData,
    });
  }

  static async getSupplierById(id: string) {
    const db = this.checkDatabase();
    return await db.supplier.findUnique({
      where: { id },
    });
  }

  static async getAllSuppliers() {
    const db = this.checkDatabase();
    return await db.supplier.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  static async updateSupplier(id: string, supplierData: any) {
    const db = this.checkDatabase();
    return await db.supplier.update({
      where: { id },
      data: supplierData,
    });
  }

  static async deleteSupplier(id: string) {
    const db = this.checkDatabase();
    return await db.supplier.delete({
      where: { id },
    });
  }

  // Material operations
  static async createMaterial(materialData: any) {
    const db = this.checkDatabase();
    return await db.material.create({
      data: materialData,
    });
  }

  static async getMaterialById(id: string) {
    const db = this.checkDatabase();
    return await db.material.findUnique({
      where: { id },
    });
  }

  static async getAllMaterials() {
    const db = this.checkDatabase();
    return await db.material.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  static async updateMaterial(id: string, materialData: any) {
    const db = this.checkDatabase();
    return await db.material.update({
      where: { id },
      data: materialData,
    });
  }

  static async deleteMaterial(id: string) {
    const db = this.checkDatabase();
    return await db.material.delete({
      where: { id },
    });
  }

  // Sales Person operations
  static async createSalesPerson(salesPersonData: any) {
    const db = this.checkDatabase();
    return await db.salesPerson.create({
      data: salesPersonData,
    });
  }

  static async getSalesPersonById(id: string) {
    const db = this.checkDatabase();
    return await db.salesPerson.findUnique({
      where: { id },
    });
  }

  static async getAllSalesPersons() {
    const db = this.checkDatabase();
    return await db.salesPerson.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  static async updateSalesPerson(id: string, salesPersonData: any) {
    const db = this.checkDatabase();
    return await db.salesPerson.update({
      where: { id },
      data: salesPersonData,
    });
  }

  static async deleteSalesPerson(id: string) {
    const db = this.checkDatabase();
    return await db.salesPerson.delete({
      where: { id },
    });
  }

  // Search operations
  static async searchQuotes(query: string) {
    const db = this.checkDatabase();
    return await db.quote.findMany({
      where: {
        OR: [
          { quoteId: { contains: query } },
          { product: { contains: query } },
          { client: { contactPerson: { contains: query } } },
          { client: { companyName: { contains: query } } },
        ],
      },
      include: {
        client: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  static async searchClients(query: string) {
    const db = this.checkDatabase();
    return await db.client.findMany({
      where: {
        OR: [
          { contactPerson: { contains: query } },
          { companyName: { contains: query } },
          { email: { contains: query } },
          { phone: { contains: query } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  static async searchSuppliers(query: string) {
    const db = this.checkDatabase();
    return await db.supplier.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { contact: { contains: query } },
          { email: { contains: query } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  static async searchSalesPersons(query: string) {
    const db = this.checkDatabase();
    return await db.salesPerson.findMany({
      where: {
        OR: [
          { name: { contains: query } },
          { email: { contains: query } },
          { salesPersonId: { contains: query } },
        ],
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });
  }

  // Get counts for dashboard
  static async getDashboardCounts() {
    const db = this.checkDatabase();
    const [quotes, clients, suppliers, salesPersons] = await Promise.all([
      db.quote.count(),
      db.client.count(),
      db.supplier.count(),
      db.salesPerson.count(),
    ]);

    return {
      quotes,
      clients,
      suppliers,
      salesPersons,
    };
  }

  // Get recent quotes for dashboard
  static async getRecentQuotes(limit: number = 10) {
    const db = this.checkDatabase();
    return await db.quote.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            id: true,
            contactPerson: true,
            companyName: true,
            email: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }
}

// Export the main prisma instance
export default prisma;
