const { PrismaClient } = require('@prisma/client');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create SQLite connection
const sqliteDb = new sqlite3.Database(path.join(__dirname, '../prisma/dev.db'));

// Create PostgreSQL connection (will use DATABASE_URL from environment)
const postgresPrisma = new PrismaClient();

async function migrateToVercel() {
  try {
    console.log('🚀 Starting migration from local SQLite to Vercel PostgreSQL...');
    
    // Test PostgreSQL connection
    console.log('🔌 Testing PostgreSQL connection...');
    await postgresPrisma.$queryRaw`SELECT 1`;
    console.log('✅ PostgreSQL connection successful');
    
    // Migrate Users
    console.log('\n👥 Migrating users...');
    const users = await new Promise((resolve, reject) => {
      sqliteDb.all("SELECT * FROM User", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`Found ${users.length} users in SQLite`);
    
    for (const user of users) {
      try {
        await postgresPrisma.user.upsert({
          where: { email: user.email },
          update: {
            name: user.name,
            role: user.role,
            password: user.password,
            profilePicture: user.profilePicture,
            status: user.status,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt)
          },
          create: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            password: user.password,
            profilePicture: user.profilePicture,
            status: user.status,
            createdAt: new Date(user.createdAt),
            updatedAt: new Date(user.updatedAt)
          }
        });
        console.log(`✅ User migrated: ${user.email}`);
      } catch (error) {
        console.error(`❌ Failed to migrate user ${user.email}:`, error.message);
      }
    }
    
    // Migrate Clients
    console.log('\n🏢 Migrating clients...');
    const clients = await new Promise((resolve, reject) => {
      sqliteDb.all("SELECT * FROM Client", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`Found ${clients.length} clients in SQLite`);
    
    for (const client of clients) {
      try {
        await postgresPrisma.client.upsert({
          where: { id: client.id },
          update: {
            clientType: client.clientType,
            companyName: client.companyName,
            contactPerson: client.contactPerson,
            email: client.email,
            phone: client.phone,
            countryCode: client.countryCode,
            role: client.role,
            userId: client.userId,
            createdAt: new Date(client.createdAt),
            updatedAt: new Date(client.updatedAt)
          },
          create: {
            id: client.id,
            clientType: client.clientType,
            companyName: client.companyName,
            contactPerson: client.contactPerson,
            email: client.email,
            phone: client.phone,
            countryCode: client.countryCode,
            role: client.role,
            userId: client.userId,
            createdAt: new Date(client.createdAt),
            updatedAt: new Date(client.updatedAt)
          }
        });
        console.log(`✅ Client migrated: ${client.contactPerson}`);
      } catch (error) {
        console.error(`❌ Failed to migrate client ${client.contactPerson}:`, error.message);
      }
    }
    
    // Migrate Suppliers
    console.log('\n🏭 Migrating suppliers...');
    const suppliers = await new Promise((resolve, reject) => {
      sqliteDb.all("SELECT * FROM Supplier", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`Found ${suppliers.length} suppliers in SQLite`);
    
    for (const supplier of suppliers) {
      try {
        await postgresPrisma.supplier.upsert({
          where: { id: supplier.id },
          update: {
            name: supplier.name,
            contact: supplier.contact,
            email: supplier.email,
            phone: supplier.phone,
            countryCode: supplier.countryCode,
            address: supplier.address,
            city: supplier.city,
            state: supplier.state,
            postalCode: supplier.postalCode,
            country: supplier.country,
            status: supplier.status,
            createdAt: new Date(supplier.createdAt),
            updatedAt: new Date(supplier.updatedAt)
          },
          create: {
            id: supplier.id,
            name: supplier.name,
            contact: supplier.contact,
            email: supplier.email,
            phone: supplier.phone,
            countryCode: supplier.countryCode,
            address: supplier.address,
            city: supplier.city,
            state: supplier.state,
            postalCode: supplier.postalCode,
            country: supplier.country,
            status: supplier.status,
            createdAt: new Date(supplier.createdAt),
            updatedAt: new Date(supplier.updatedAt)
          }
        });
        console.log(`✅ Supplier migrated: ${supplier.name}`);
      } catch (error) {
        console.error(`❌ Failed to migrate supplier ${supplier.name}:`, error.message);
      }
    }
    
    // Migrate Materials
    console.log('\n📦 Migrating materials...');
    const materials = await new Promise((resolve, reject) => {
      sqliteDb.all("SELECT * FROM Material", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`Found ${materials.length} materials in SQLite`);
    
    for (const material of materials) {
      try {
        await postgresPrisma.material.upsert({
          where: { id: material.id },
          update: {
            materialId: material.materialId,
            name: material.name,
            supplierId: material.supplierId,
            cost: material.cost,
            unit: material.unit,
            status: material.status,
            lastUpdated: new Date(material.lastUpdated),
            createdAt: new Date(material.createdAt),
            updatedAt: new Date(material.updatedAt)
          },
          create: {
            id: material.id,
            materialId: material.materialId,
            name: material.name,
            supplierId: material.supplierId,
            cost: material.cost,
            unit: material.unit,
            status: material.status,
            lastUpdated: new Date(material.lastUpdated),
            createdAt: new Date(material.createdAt),
            updatedAt: new Date(material.updatedAt)
          }
        });
        console.log(`✅ Material migrated: ${material.name}`);
      } catch (error) {
        console.error(`❌ Failed to migrate material ${material.name}:`, error.message);
      }
    }
    
    // Migrate Quotes (with related data)
    console.log('\n📄 Migrating quotes...');
    const quotes = await new Promise((resolve, reject) => {
      sqliteDb.all("SELECT * FROM Quote", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`Found ${quotes.length} quotes in SQLite`);
    
    for (const quote of quotes) {
      try {
        // Create quote
        await postgresPrisma.quote.upsert({
          where: { id: quote.id },
          update: {
            quoteId: quote.quoteId,
            date: new Date(quote.date),
            status: quote.status,
            clientId: quote.clientId,
            userId: quote.userId,
            product: quote.product,
            quantity: quote.quantity,
            sides: quote.sides,
            printing: quote.printing,
            createdAt: new Date(quote.createdAt),
            updatedAt: new Date(quote.updatedAt)
          },
          create: {
            id: quote.id,
            quoteId: quote.quoteId,
            date: new Date(quote.date),
            status: quote.status,
            clientId: quote.clientId,
            userId: quote.userId,
            product: quote.product,
            quantity: quote.quantity,
            sides: quote.sides,
            printing: quote.printing,
            createdAt: new Date(quote.createdAt),
            updatedAt: new Date(quote.updatedAt)
          }
        });
        
        // Migrate related papers
        const papers = await new Promise((resolve, reject) => {
          sqliteDb.all("SELECT * FROM Paper WHERE quoteId = ?", [quote.id], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });
        
        for (const paper of papers) {
          await postgresPrisma.paper.upsert({
            where: { id: paper.id },
            update: {
              name: paper.name,
              gsm: paper.gsm,
              quoteId: paper.quoteId
            },
            create: {
              id: paper.id,
              name: paper.name,
              gsm: paper.gsm,
              quoteId: paper.quoteId
            }
          });
        }
        
        // Migrate related finishing
        const finishing = await new Promise((resolve, reject) => {
          sqliteDb.all("SELECT * FROM Finishing WHERE quoteId = ?", [quote.id], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });
        
        for (const finish of finishing) {
          await postgresPrisma.finishing.upsert({
            where: { id: finish.id },
            update: {
              name: finish.name,
              quoteId: finish.quoteId
            },
            create: {
              id: finish.id,
              name: finish.name,
              quoteId: finish.quoteId
            }
          });
        }
        
        // Migrate related amounts
        const amounts = await new Promise((resolve, reject) => {
          sqliteDb.all("SELECT * FROM QuoteAmount WHERE quoteId = ?", [quote.id], (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
          });
        });
        
        for (const amount of amounts) {
          await postgresPrisma.quoteAmount.upsert({
            where: { id: amount.id },
            update: {
              base: amount.base,
              vat: amount.vat,
              total: amount.total,
              quoteId: amount.quoteId
            },
            create: {
              id: amount.id,
              base: amount.base,
              vat: amount.vat,
              total: amount.total,
              quoteId: amount.quoteId
            }
          });
        }
        
        console.log(`✅ Quote migrated: ${quote.quoteId}`);
      } catch (error) {
        console.error(`❌ Failed to migrate quote ${quote.quoteId}:`, error.message);
      }
    }
    
    // Migrate Search History
    console.log('\n🔍 Migrating search history...');
    const searchHistory = await new Promise((resolve, reject) => {
      sqliteDb.all("SELECT * FROM SearchHistory", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`Found ${searchHistory.length} search history records in SQLite`);
    
    for (const record of searchHistory) {
      try {
        await postgresPrisma.searchHistory.upsert({
          where: { id: record.id },
          update: {
            query: record.query,
            timestamp: new Date(record.timestamp),
            userId: record.userId
          },
          create: {
            id: record.id,
            query: record.query,
            timestamp: new Date(record.timestamp),
            userId: record.userId
          }
        });
      } catch (error) {
        console.error(`❌ Failed to migrate search history:`, error.message);
      }
    }
    
    // Migrate Search Analytics
    console.log('\n📊 Migrating search analytics...');
    const searchAnalytics = await new Promise((resolve, reject) => {
      sqliteDb.all("SELECT * FROM SearchAnalytics", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    console.log(`Found ${searchAnalytics.length} search analytics records in SQLite`);
    
    for (const record of searchAnalytics) {
      try {
        await postgresPrisma.searchAnalytics.upsert({
          where: { id: record.id },
          update: {
            query: record.query,
            timestamp: new Date(record.timestamp),
            userId: record.userId
          },
          create: {
            id: record.id,
            query: record.query,
            timestamp: new Date(record.timestamp),
            userId: record.userId
          }
        });
      } catch (error) {
        console.error(`❌ Failed to migrate search analytics:`, error.message);
      }
    }
    
    console.log('\n🎉 Migration completed successfully!');
    console.log('\n📊 Migration Summary:');
    console.log(`   - Users: ${users.length}`);
    console.log(`   - Clients: ${clients.length}`);
    console.log(`   - Quotes: ${quotes.length}`);
    console.log(`   - Suppliers: ${suppliers.length}`);
    console.log(`   - Materials: ${materials.length}`);
    console.log(`   - Search History: ${searchHistory.length}`);
    console.log(`   - Search Analytics: ${searchAnalytics.length}`);
    
    // Verify admin user
    const adminUser = await postgresPrisma.user.findUnique({
      where: { email: 'admin@example.com' }
    });
    
    if (adminUser) {
      console.log('\n👤 Admin User Verified:');
      console.log(`   - Email: ${adminUser.email}`);
      console.log(`   - Name: ${adminUser.name}`);
      console.log(`   - Role: ${adminUser.role}`);
      console.log(`   - Password: ${adminUser.password ? 'Set' : 'Not set'}`);
      console.log('\n✅ You can now login with admin@example.com on Vercel!');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    // Close connections
    sqliteDb.close();
    await postgresPrisma.$disconnect();
  }
}

migrateToVercel();
