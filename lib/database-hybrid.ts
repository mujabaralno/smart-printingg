// Hybrid Database Service with Fallback Data
// This service provides data whether the database is connected or not

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  password?: string;
  profilePicture?: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface Client {
  id: string;
  clientType: string;
  companyName?: string | null;
  contactPerson: string;
  email: string;
  phone: string;
  countryCode: string;
  role?: string | null;
  userId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: string;
  quoteId: string;
  date: string;
  status: string;
  clientId: string;
  userId?: string | null;
  product: string;
  quantity: number;
  sides: string;
  printing: string;
  createdAt: string;
  updatedAt: string;
}

// Fallback data for when database is not available
const FALLBACK_DATA = {
  users: [
    {
      id: "admin-001",
      email: "admin@example.com",
      name: "John Admin",
      role: "admin",
      password: "admin123",
      profilePicture: null,
      status: "Active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "estimator-001",
      email: "estimator@example.com",
      name: "Sarah Estimator",
      role: "estimator",
      password: "estimator123",
      profilePicture: null,
      status: "Active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "user-001",
      email: "user@example.com",
      name: "Mike User",
      role: "user",
      password: "user123",
      profilePicture: null,
      status: "Active",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  clients: [
    {
      id: "client-001",
      clientType: "Company",
      companyName: "Tech Solutions Ltd.",
      contactPerson: "John Smith",
      email: "john@techsolutions.com",
      phone: "+971-50-123-4567",
      countryCode: "+971",
      role: "CEO",
      userId: "admin-001",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "client-002",
      clientType: "Individual",
      companyName: null,
      contactPerson: "Sarah Johnson",
      email: "sarah.j@email.com",
      phone: "+971-55-987-6543",
      countryCode: "+971",
      role: null,
      userId: "estimator-001",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  quotes: [
    {
      id: "quote-001",
      quoteId: "QT-2025-0820-001",
      date: new Date().toISOString(),
      status: "Pending",
      clientId: "client-001",
      userId: "admin-001",
      product: "Business Cards",
      quantity: 1000,
      sides: "2",
      printing: "Digital",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "quote-002",
      quoteId: "QT-2025-0820-002",
      date: new Date().toISOString(),
      status: "Approved",
      clientId: "client-002",
      userId: "estimator-001",
      product: "Brochures",
      quantity: 500,
      sides: "1",
      printing: "Offset",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "quote-003",
      quoteId: "QT-2025-0820-003",
      date: new Date().toISOString(),
      status: "Completed",
      clientId: "client-001",
      userId: "admin-001",
      product: "Flyers",
      quantity: 2000,
      sides: "1",
      printing: "Digital",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
};

// Hybrid Database Service
export class HybridDatabaseService {
  // User operations
  static async getAllUsers(): Promise<User[]> {
    try {
      // Try to use the original database service first
      const { DatabaseService } = await import('./database');
      return await DatabaseService.getAllUsers();
    } catch (error) {
      console.log('🔄 Database not available, using fallback users data');
      return FALLBACK_DATA.users;
    }
  }

  static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const { DatabaseService } = await import('./database');
      return await DatabaseService.getUserByEmail(email);
    } catch (error) {
      console.log('🔄 Using fallback user data for email:', email);
      return FALLBACK_DATA.users.find(u => u.email === email) || null;
    }
  }

  static async getUserById(id: string): Promise<User | null> {
    try {
      const { DatabaseService } = await import('./database');
      return await DatabaseService.getUserById(id);
    } catch (error) {
      console.log('🔄 Using fallback user data for ID:', id);
      return FALLBACK_DATA.users.find(u => u.id === id) || null;
    }
  }

  static async createUser(userData: {
    email: string;
    name: string;
    role?: string;
    profilePicture?: string;
  }): Promise<User> {
    try {
      const { DatabaseService } = await import('./database');
      return await DatabaseService.createUser(userData);
    } catch (error) {
      console.log('🔄 Creating fallback user');
      return {
        id: `fallback-${Date.now()}`,
        ...userData,
        status: "Active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  }

  // Client operations
  static async getAllClients(): Promise<Client[]> {
    try {
      const { DatabaseService } = await import('./database');
      return await DatabaseService.getAllClients();
    } catch (error) {
      console.log('🔄 Using fallback clients data');
      return FALLBACK_DATA.clients;
    }
  }

  static async getClientById(id: string): Promise<Client | null> {
    try {
      const { DatabaseService } = await import('./database');
      return await DatabaseService.getClientById(id);
    } catch (error) {
      console.log('🔄 Using fallback client data for ID:', id);
      return FALLBACK_DATA.clients.find(c => c.id === id) || null;
    }
  }

  static async createClient(clientData: {
    clientType: string;
    companyName?: string;
    contactPerson: string;
    email: string;
    phone: string;
    countryCode: string;
    role?: string;
    userId?: string;
  }): Promise<Client> {
    try {
      const { DatabaseService } = await import('./database');
      return await DatabaseService.createClient(clientData);
    } catch (error) {
      console.log('🔄 Creating fallback client');
      return {
        id: `fallback-client-${Date.now()}`,
        ...clientData,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  }

  // Quote operations
  static async getAllQuotes(): Promise<Quote[]> {
    try {
      const { DatabaseService } = await import('./database');
      return await DatabaseService.getAllQuotes();
    } catch (error) {
      console.log('🔄 Using fallback quotes data');
      return FALLBACK_DATA.quotes;
    }
  }

  static async getQuoteById(id: string): Promise<Quote | null> {
    try {
      const { DatabaseService } = await import('./database');
      return await DatabaseService.getQuoteById(id);
    } catch (error) {
      console.log('🔄 Using fallback quote data for ID:', id);
      return FALLBACK_DATA.quotes.find(q => q.id === id) || null;
    }
  }

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
  }): Promise<Quote> {
    try {
      const { DatabaseService } = await import('./database');
      return await DatabaseService.createQuote(quoteData);
    } catch (error) {
      console.log('🔄 Creating fallback quote');
      return {
        id: `fallback-quote-${Date.now()}`,
        ...quoteData,
        date: quoteData.date.toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    }
  }

  // Dashboard statistics
  static async getDashboardStats() {
    try {
      const quotes = await this.getAllQuotes();
      
      return {
        totalQuotes: quotes.length,
        approved: quotes.filter(q => q.status === 'Approved').length,
        pending: quotes.filter(q => q.status === 'Pending').length,
        rejected: quotes.filter(q => q.status === 'Rejected').length,
        completed: quotes.filter(q => q.status === 'Completed').length
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        totalQuotes: 0,
        approved: 0,
        pending: 0,
        rejected: 0,
        completed: 0
      };
    }
  }

  // Get quotes with client information
  static async getQuotesWithClients(): Promise<any[]> {
    try {
      const quotes = await this.getAllQuotes();
      const clients = await this.getAllClients();
      
      return quotes.map(quote => {
        const client = clients.find(c => c.id === quote.clientId);
        return {
          ...quote,
          client: client || null
        };
      });
    } catch (error) {
      console.error('Error getting quotes with clients:', error);
      return [];
    }
  }
}
