import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Database service class
export class DatabaseService {
  // User operations
  static async createUser(userData: {
    email: string;
    name: string;
    role?: string;
    profilePicture?: string;
  }) {
    return await prisma.user.create({
      data: userData,
    });
  }

  static async getUserByEmail(email: string) {
    return await prisma.user.findUnique({
      where: { email },
    });
  }

  static async getUserById(id: string) {
    return await prisma.user.findUnique({
      where: { id },
      include: {
        quotes: true,
        clients: true,
      },
    });
  }

  static async updateUser(id: string, data: any) {
    return await prisma.user.update({
      where: { id },
      data,
    });
  }

  static async deleteUser(id: string) {
    return await prisma.user.delete({
      where: { id },
    });
  }

  static async getAllUsers() {
    return await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  // Client operations
  static async createClient(clientData: {
    clientType: string;
    companyName?: string;
    contactPerson: string;
    email: string;
    phone: string;
    countryCode: string;
    role?: string;
    userId?: string;
  }) {
    return await prisma.client.create({
      data: clientData,
    });
  }

  static async getClientById(id: string) {
    return await prisma.client.findUnique({
      where: { id },
      include: {
        quotes: true,
        user: true,
      },
    });
  }

  static async getClientByEmail(email: string) {
    return await prisma.client.findFirst({
      where: { email },
      include: {
        quotes: true,
        user: true,
      },
    });
  }

  static async getAllClients() {
    return await prisma.client.findMany({
      include: {
        quotes: true,
        user: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async updateClient(id: string, data: any) {
    return await prisma.client.update({
      where: { id },
      data,
    });
  }

  static async deleteClient(id: string) {
    return await prisma.client.delete({
      where: { id },
    });
  }

  // Quote operations
  static async createQuote(quoteData: {
    quoteId: string;
    date: Date;
    status: string;
    clientId: string;
    userId?: string;
    product: string;
    quantity: number;
    sides: string;
    printing: string;
  }) {
    return await prisma.quote.create({
      data: quoteData,
      include: {
        client: true,
        user: true,
        amounts: true,
      },
    });
  }

  // Create quote with complete details including papers, finishing, and amounts
  static async createQuoteWithDetails(quoteData: {
    quoteId: string;
    date: Date;
    status: string;
    clientId: string;
    userId?: string;
    product: string;
    quantity: number;
    sides: string;
    printing: string;
    papers?: { name: string; gsm: string }[];
    finishing?: string[];
    amounts?: { base: number; vat: number; total: number };
  }) {
    const { papers, finishing, amounts, ...basicQuoteData } = quoteData;
    
    return await prisma.quote.create({
      data: {
        ...basicQuoteData,
        papers: papers ? {
          create: papers.map(paper => ({
            name: paper.name,
            gsm: paper.gsm,
          }))
        } : undefined,
        finishing: finishing ? {
          create: finishing.map(finish => ({
            name: finish,
          }))
        } : undefined,
        amounts: amounts ? {
          create: amounts
        } : undefined,
      },
      include: {
        client: true,
        user: true,
        papers: true,
        finishing: true,
        amounts: true,
      },
    });
  }

  static async getQuoteById(id: string) {
    return await prisma.quote.findUnique({
      where: { id },
      include: {
        client: true,
        user: true,
        papers: true,
        finishing: true,
        amounts: true,
      },
    });
  }

  static async getQuoteByQuoteId(quoteId: string) {
    return await prisma.quote.findUnique({
      where: { quoteId },
      include: {
        client: true,
        user: true,
        papers: true,
        finishing: true,
        amounts: true,
      },
    });
  }

  static async getAllQuotes() {
    return await prisma.quote.findMany({
      include: {
        client: true,
        user: true,
        amounts: true,
      },
      orderBy: { date: 'desc' },
    });
  }

  static async getQuotesByStatus(status: string) {
    return await prisma.quote.findMany({
      where: { status },
      include: {
        client: true,
        user: true,
        papers: true,
        finishing: true,
        amounts: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  static async updateQuoteStatus(id: string, status: string) {
    return await prisma.quote.update({
      where: { id },
      data: { status },
      include: {
        client: true,
        user: true,
        papers: true,
        finishing: true,
        amounts: true,
      },
    });
  }

  static async updateQuote(id: string, data: any) {
    try {
      const { amount, clientId, ...quoteData } = data;
      
      console.log('DatabaseService.updateQuote called with:', { id, data });
      
      // First, verify the quote exists
      const existingQuote = await prisma.quote.findUnique({
        where: { id },
        include: {
          client: true,
          user: true,
          amounts: true,
        },
      });
      
      if (!existingQuote) {
        throw new Error('Quote not found in database');
      }
      
      console.log('Found existing quote:', existingQuote.id);
      
      // Start a transaction to update both Quote and QuoteAmount
      return await prisma.$transaction(async (tx) => {
        // Prepare the quote update data, only including valid fields
        const validQuoteData: any = {};
        
        if (quoteData.date !== undefined) validQuoteData.date = quoteData.date;
        if (quoteData.status !== undefined) validQuoteData.status = quoteData.status;
        if (quoteData.userId !== undefined) validQuoteData.userId = quoteData.userId;
        if (quoteData.product !== undefined) validQuoteData.product = quoteData.product;
        if (quoteData.quantity !== undefined) validQuoteData.quantity = quoteData.quantity;
        if (clientId !== undefined) validQuoteData.clientId = clientId;

        console.log('Updating quote with valid data:', validQuoteData);

        // Update the quote
        const updatedQuote = await tx.quote.update({
          where: { id },
          data: validQuoteData,
          include: {
            client: true,
            user: true,
            papers: true,
            finishing: true,
            amounts: true,
          },
        });

        console.log('Quote updated successfully:', updatedQuote.id);

        // If amount is provided, update the QuoteAmount
        if (amount !== undefined) {
          console.log('Updating amount to:', amount);
          
          // Check if QuoteAmount exists, if not create it
          const existingAmount = await tx.quoteAmount.findUnique({
            where: { quoteId: id },
          });

          if (existingAmount) {
            await tx.quoteAmount.update({
              where: { quoteId: id },
              data: { total: amount },
            });
            console.log('Updated existing amount record');
          } else {
            await tx.quoteAmount.create({
              data: {
                quoteId: id,
                base: amount,
                vat: 0,
                total: amount,
              },
            });
            console.log('Created new amount record');
          }
          
          // Refresh the quote data to include updated amounts
          const refreshedQuote = await tx.quote.findUnique({
            where: { id },
            include: {
              client: true,
              user: true,
              papers: true,
              finishing: true,
              amounts: true,
            },
          });
          
          console.log('Refreshed quote with amounts:', refreshedQuote?.amounts);
          return refreshedQuote;
        }

        return updatedQuote;
      }, {
        // Add timeout and retry options for SQLite
        timeout: 10000,
        maxWait: 5000,
      });
    } catch (error) {
      console.error('Error in updateQuote:', error);
      throw error;
    }
  }

  // Update quote with complete details including papers, finishing, and amounts
  static async updateQuoteWithDetails(id: string, data: any) {
    try {
      console.log('DatabaseService.updateQuoteWithDetails called with:', { id, data });
      
      // First, verify the quote exists
      const existingQuote = await prisma.quote.findUnique({
        where: { id },
        include: {
          client: true,
          user: true,
          amounts: true,
          papers: true,
          finishing: true,
        },
      });
      
      if (!existingQuote) {
        throw new Error('Quote not found in database');
      }
      
      console.log('Found existing quote:', existingQuote.id);
      
      // Start a transaction to update quote and all related data
      return await prisma.$transaction(async (tx) => {
        // Prepare the quote update data
        const validQuoteData: any = {};
        
        if (data.date !== undefined) validQuoteData.date = data.date;
        if (data.status !== undefined) validQuoteData.status = data.status;
        if (data.userId !== undefined) validQuoteData.userId = data.userId;
        if (data.clientId !== undefined) validQuoteData.clientId = data.clientId;
        if (data.product !== undefined) validQuoteData.product = data.product;
        if (data.quantity !== undefined) validQuoteData.quantity = data.quantity;
        if (data.sides !== undefined) validQuoteData.sides = data.sides;
        if (data.printing !== undefined) validQuoteData.printing = data.printing;

        console.log('Updating quote with valid data:', validQuoteData);

        // Update the quote
        const updatedQuote = await tx.quote.update({
          where: { id },
          data: validQuoteData,
          include: {
            client: true,
            user: true,
            papers: true,
            finishing: true,
            amounts: true,
          },
        });

        console.log('Quote updated successfully:', updatedQuote.id);

        // Update papers if provided
        if (data.papers && Array.isArray(data.papers)) {
          console.log('Updating papers:', data.papers);
          
          // Delete existing papers
          await tx.paper.deleteMany({
            where: { quoteId: id },
          });
          
          // Create new papers
          if (data.papers.length > 0) {
            await tx.paper.createMany({
              data: data.papers.map((paper: any) => ({
                quoteId: id,
                name: paper.name || 'Standard Paper',
                gsm: paper.gsm || '150',
              })),
            });
          }
        }

        // Update finishing if provided
        if (data.finishing && Array.isArray(data.finishing)) {
          console.log('Updating finishing:', data.finishing);
          
          // Delete existing finishing
          await tx.finishing.deleteMany({
            where: { quoteId: id },
          });
          
          // Create new finishing
          if (data.finishing.length > 0) {
            await tx.finishing.createMany({
              data: data.finishing.map((finish: any) => ({
                quoteId: id,
                name: finish.name || finish, // Handle both object and string formats
              })),
            });
          }
        }

        // Update amounts if provided
        if (data.amounts) {
          console.log('Updating amounts:', data.amounts);
          
          // Check if QuoteAmount exists, if not create it
          const existingAmount = await tx.quoteAmount.findUnique({
            where: { quoteId: id },
          });

          if (existingAmount) {
            await tx.quoteAmount.update({
              where: { quoteId: id },
              data: {
                base: data.amounts.base || 0,
                vat: data.amounts.vat || 0,
                total: data.amounts.total || 0,
              },
            });
            console.log('Updated existing amount record');
          } else {
            await tx.quoteAmount.create({
              data: {
                quoteId: id,
                base: data.amounts.base || 0,
                vat: data.amounts.vat || 0,
                total: data.amounts.total || 0,
              },
            });
            console.log('Created new amount record');
          }
        }
        
        // Refresh the quote data to include all updated related data
        const refreshedQuote = await tx.quote.findUnique({
          where: { id },
          include: {
            client: true,
            user: true,
            papers: true,
            finishing: true,
            amounts: true,
          },
        });
        
        console.log('Refreshed quote with all details:', refreshedQuote);
        return refreshedQuote;
      }, {
        // Add timeout and retry options for SQLite
        timeout: 15000,
        maxWait: 5000,
      });
    } catch (error) {
      console.error('Error in updateQuoteWithDetails:', error);
      throw error;
    }
  }

  static async deleteQuote(id: string) {
    return await prisma.quote.delete({
      where: { id },
    });
  }

  // QuoteAmount operations
  static async createQuoteAmount(amountData: {
    quoteId: string;
    base: number;
    vat: number;
    total: number;
  }) {
    return await prisma.quoteAmount.create({
      data: amountData,
    });
  }

  // Search operations
  static async saveSearchHistory(query: string, userId?: string) {
    return await prisma.searchHistory.create({
      data: {
        query,
        userId,
      },
    });
  }

  static async getSearchHistory(userId?: string, limit = 10) {
    return await prisma.searchHistory.findMany({
      where: userId ? { userId } : {},
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  static async saveSearchAnalytics(query: string, userId?: string) {
    return await prisma.searchAnalytics.create({
      data: {
        query,
        userId,
      },
    });
  }

  static async getSearchAnalytics(userId?: string, limit = 100) {
    return await prisma.searchAnalytics.findMany({
      where: userId ? { userId } : {},
      orderBy: { timestamp: 'desc' },
      take: limit,
    });
  }

  // Statistics
  static async getQuoteStats() {
    const total = await prisma.quote.count();
    const pending = await prisma.quote.count({ where: { status: 'Pending' } });
    const approved = await prisma.quote.count({ where: { status: 'Approved' } });
    const rejected = await prisma.quote.count({ where: { status: 'Rejected' } });
    const completed = await prisma.quote.count({ where: { status: 'Completed' } });

    return {
      total,
      pending,
      approved,
      rejected,
      completed,
    };
  }

  // Supplier operations
  static async createSupplier(supplierData: {
    name: string;
    contact?: string;
    email?: string;
    phone?: string;
    countryCode?: string;
    address?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    status?: string;
  }) {
    return await prisma.supplier.create({
      data: supplierData,
    });
  }

  static async getSupplierById(id: string) {
    return await prisma.supplier.findUnique({
      where: { id },
      include: {
        materials: true,
      },
    });
  }

  static async getAllSuppliers() {
    return await prisma.supplier.findMany({
      include: {
        materials: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  static async updateSupplier(id: string, data: any) {
    return await prisma.supplier.update({
      where: { id },
      data,
      include: {
        materials: true,
      },
    });
  }

  static async deleteSupplier(id: string) {
    return await prisma.supplier.delete({
      where: { id },
    });
  }

  // Material operations
  static async createMaterial(materialData: {
    materialId: string;
    name: string;
    supplierId: string;
    cost: number;
    unit: string;
    status?: string;
  }) {
    return await prisma.material.create({
      data: materialData,
      include: {
        supplier: true,
      },
    });
  }

  static async getMaterialById(id: string) {
    return await prisma.material.findUnique({
      where: { id },
      include: {
        supplier: true,
      },
    });
  }

  static async getAllMaterials() {
    return await prisma.material.findMany({
      include: {
        supplier: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  static async updateMaterial(id: string, data: any) {
    return await prisma.material.update({
      where: { id },
      data,
      include: {
        supplier: true,
      },
    });
  }

  static async deleteMaterial(id: string) {
    return await prisma.material.delete({
      where: { id },
    });
  }

  // Get materials by supplier
  static async getMaterialsBySupplier(supplierId: string) {
    return await prisma.material.findMany({
      where: { supplierId },
      include: {
        supplier: true,
      },
      orderBy: { name: 'asc' },
    });
  }

  static async getClientStats() {
    const total = await prisma.client.count();
    const companies = await prisma.client.count({ where: { clientType: 'Company' } });
    const individuals = await prisma.client.count({ where: { clientType: 'Individual' } });

    return {
      total,
      companies,
      individuals,
    };
  }

  // Migration helper - convert dummy data to database
  static async migrateDummyData() {
    // This will be used to migrate existing dummy data to the database
    console.log('Starting dummy data migration...');
    
    // Create default admin user if none exists
    const existingUser = await prisma.user.findFirst();
    if (!existingUser) {
      await prisma.user.create({
        data: {
          email: 'admin@example.com',
          name: 'John Admin',
          role: 'admin',
        },
      });
      console.log('Created default admin user');
    }

    console.log('Dummy data migration completed');
  }

  // Seed database with initial users
  static async seedUsers() {
    console.log('Starting user seeding...');
    
    const usersToSeed = [
      {
        email: 'admin@example.com',
        name: 'John Admin',
        role: 'admin',
        password: 'admin123',
      },
      {
        email: 'estimator@example.com',
        name: 'Jane Estimator',
        role: 'estimator',
        password: 'estimator123',
      },
      {
        email: 'user@example.com',
        name: 'Bob User',
        role: 'user',
        password: 'user123',
      }
    ];

    for (const userData of usersToSeed) {
      try {
        const existingUser = await prisma.user.findUnique({
          where: { email: userData.email }
        });
        
        if (!existingUser) {
          await prisma.user.create({
            data: userData,
          });
          console.log(`Created user: ${userData.email}`);
        } else {
          // Update existing user with password if missing
          if (!existingUser.password) {
            await prisma.user.update({
              where: { email: userData.email },
              data: { password: userData.password }
            });
            console.log(`Updated user password: ${userData.email}`);
          } else {
            console.log(`User already exists: ${userData.email}`);
          }
        }
      } catch (error) {
        console.error(`Error creating user ${userData.email}:`, error);
      }
    }

    // Also update existing users with passwords if they don't have them
    const existingUsers = await prisma.user.findMany({
      where: { password: null }
    });

    for (const user of existingUsers) {
      try {
        let defaultPassword = 'password123';
        
        // Set role-specific passwords
        if (user.role === 'admin') {
          defaultPassword = 'admin123';
        } else if (user.role === 'estimator') {
          defaultPassword = 'estimator123';
        } else if (user.role === 'manager') {
          defaultPassword = 'manager123';
        }
        
        await prisma.user.update({
          where: { id: user.id },
          data: { password: defaultPassword }
        });
        console.log(`Set password for user: ${user.email}`);
      } catch (error) {
        console.error(`Error setting password for user ${user.email}:`, error);
      }
    }

    console.log('User seeding completed');
  }

  // Seed database with initial clients
  static async seedClients() {
    console.log('Starting client seeding...');
    
    const clientsToSeed = [
      {
        clientType: 'Company',
        companyName: 'Eagan Inc.',
        contactPerson: 'John Smith',
        email: 'john.smith@eagan.com',
        phone: '501234567',
        countryCode: '+971',
        role: 'Marketing Manager',
      },
      {
        clientType: 'Company',
        companyName: 'Tech Solutions Ltd.',
        contactPerson: 'Sarah Johnson',
        email: 'sarah.j@techsolutions.com',
        phone: '559876543',
        countryCode: '+971',
        role: 'Operations Director',
      },
      {
        clientType: 'Company',
        companyName: 'Global Print Corp.',
        contactPerson: 'Michael Brown',
        email: 'michael.b@globalprint.com',
        phone: '524567890',
        countryCode: '+971',
        role: 'Procurement Manager',
      },
      {
        clientType: 'Company',
        companyName: 'Creative Agency',
        contactPerson: 'Lisa Wilson',
        email: 'lisa.w@creativeagency.com',
        phone: '543210987',
        countryCode: '+971',
        role: 'Creative Director',
      },
      {
        clientType: 'Individual',
        companyName: null,
        contactPerson: 'David Lee',
        email: 'david.lee@gmail.com',
        phone: '567890123',
        countryCode: '+971',
        role: null,
      }
    ];

    for (const clientData of clientsToSeed) {
      try {
        const existingClient = await prisma.client.findFirst({
          where: { email: clientData.email }
        });
        
        if (!existingClient) {
          await prisma.client.create({
            data: clientData,
          });
          console.log(`Created client: ${clientData.contactPerson}`);
        } else {
          console.log(`Client already exists: ${clientData.contactPerson}`);
        }
      } catch (error) {
        console.error(`Error creating client ${clientData.contactPerson}:`, error);
      }
    }

    console.log('Client seeding completed');
  }
}
