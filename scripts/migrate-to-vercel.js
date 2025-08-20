const sqlite3 = require('sqlite3').verbose();
const { PrismaClient } = require('@prisma/client');
const path = require('path');

async function migrateToVercel() {
  console.log('🚀 Starting migration from local SQLite to Vercel Prisma Accelerate...');
  
  try {
    // Create Prisma client with your new working Vercel Prisma Accelerate connection
    const prisma = new PrismaClient({
      datasources: {
        db: {
          url: 'prisma+postgres://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqd3RfaWQiOjEsInNlY3VyZV9rZXkiOiJza18xc0dkeFdBOTFuNW1jNWZTNkpUczAiLCJhcGlfa2V5IjoiMDFLMzRRTVFYTVhDR0VaMkFBS1lTMFo3RUMiLCJ0ZW5hbnRfaWQiOiJjOTFjODU2MWZlOGI2YjM0YTU5ODVmMTdhYzU2NGNhMzY3OTY5ZmU5Mjg1NTdjNGM0ZjZiNWJjNzgwNzMzMjgxIiwiaW50ZXJuYWxfc2VjcmV0IjoiNGY4OWUzMTItMDE4OC00ZjE4LWFhMGQtYTc1OWVhN2EzNGE5In0.lPVxsK7w4PqWlM7f5ErZ-LE7ixz4nL1rVMJIRttzRqs'
        }
      }
    });

    console.log('🔌 Testing Prisma Accelerate connection...');
    
    // Test connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Prisma Accelerate connected successfully!');

    // Open local SQLite database
    const dbPath = path.join(__dirname, '..', 'prisma', 'dev.db');
    console.log('📁 Opening local SQLite database:', dbPath);
    
    const sqliteDb = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        console.error('❌ Error opening SQLite database:', err.message);
        throw err;
      }
      console.log('✅ Local SQLite database opened successfully');
    });

    // Helper function to run SQLite queries
    const query = (sql, params = []) => {
      return new Promise((resolve, reject) => {
        sqliteDb.all(sql, params, (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
    };

    // Migrate Users
    console.log('\n👥 Migrating Users...');
    const users = await query('SELECT * FROM User');
    console.log(`Found ${users.length} users to migrate`);
    
    for (const user of users) {
      try {
        await prisma.user.upsert({
          where: { id: user.id },
          update: {
            email: user.email,
            name: user.name,
            role: user.role,
            password: user.password,
            profilePicture: user.profilePicture,
            status: user.status,
            createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
            updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date()
          },
          create: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            password: user.password,
            profilePicture: user.profilePicture,
            status: user.status,
            createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
            updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date()
          }
        });
        console.log(`✅ User migrated: ${user.email}`);
      } catch (error) {
        console.error(`❌ Error migrating user ${user.email}:`, error.message);
      }
    }

    // Migrate Clients
    console.log('\n👥 Migrating Clients...');
    const clients = await query('SELECT * FROM Client');
    console.log(`Found ${clients.length} clients to migrate`);
    
    for (const client of clients) {
      try {
        await prisma.client.upsert({
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
            createdAt: client.createdAt ? new Date(client.createdAt) : new Date(),
            updatedAt: client.updatedAt ? new Date(client.updatedAt) : new Date()
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
            createdAt: client.createdAt ? new Date(client.createdAt) : new Date(),
            updatedAt: client.updatedAt ? new Date(client.updatedAt) : new Date()
          }
        });
        console.log(`✅ Client migrated: ${client.contactPerson}`);
      } catch (error) {
        console.error(`❌ Error migrating client ${client.contactPerson}:`, error.message);
      }
    }

    // Migrate Quotes
    console.log('\n📋 Migrating Quotes...');
    const quotes = await query('SELECT * FROM Quote');
    console.log(`Found ${quotes.length} quotes to migrate`);
    
    for (const quote of quotes) {
      try {
        await prisma.quote.upsert({
          where: { id: quote.id },
          update: {
            quoteId: quote.quoteId,
            date: quote.date ? new Date(quote.date) : new Date(),
            status: quote.status,
            clientId: quote.clientId,
            userId: quote.userId,
            product: quote.product,
            quantity: quote.quantity,
            sides: quote.sides,
            printing: quote.printing,
            createdAt: quote.createdAt ? new Date(quote.createdAt) : new Date(),
            updatedAt: quote.updatedAt ? new Date(quote.updatedAt) : new Date()
          },
          create: {
            id: quote.id,
            quoteId: quote.quoteId,
            date: quote.date ? new Date(quote.date) : new Date(),
            status: quote.status,
            clientId: quote.clientId,
            userId: quote.userId,
            product: quote.product,
            quantity: quote.quantity,
            sides: quote.sides,
            printing: quote.printing,
            createdAt: quote.createdAt ? new Date(quote.createdAt) : new Date(),
            updatedAt: quote.updatedAt ? new Date(quote.updatedAt) : new Date()
          }
        });
        console.log(`✅ Quote migrated: ${quote.quoteId}`);
      } catch (error) {
        console.error(`❌ Error migrating quote ${quote.quoteId}:`, error.message);
      }
    }

    // Migrate Papers
    console.log('\n📄 Migrating Papers...');
    const papers = await query('SELECT * FROM Paper');
    console.log(`Found ${papers.length} papers to migrate`);
    
    for (const paper of papers) {
      try {
        await prisma.paper.upsert({
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
        console.log(`✅ Paper migrated: ${paper.name}`);
      } catch (error) {
        console.error(`❌ Error migrating paper ${paper.name}:`, error.message);
      }
    }

    // Migrate Finishing
    console.log('\n✨ Migrating Finishing...');
    const finishing = await query('SELECT * FROM Finishing');
    console.log(`Found ${finishing.length} finishing options to migrate`);
    
    for (const finish of finishing) {
      try {
        await prisma.finishing.upsert({
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
        console.log(`✅ Finishing migrated: ${finish.name}`);
      } catch (error) {
        console.error(`❌ Error migrating finishing ${finish.name}:`, error.message);
      }
    }

    // Migrate Quote Amounts
    console.log('\n💰 Migrating Quote Amounts...');
    const amounts = await query('SELECT * FROM QuoteAmount');
    console.log(`Found ${amounts.length} quote amounts to migrate`);
    
    for (const amount of amounts) {
      try {
        await prisma.quoteAmount.upsert({
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
        console.log(`✅ Quote amount migrated: $${amount.total}`);
      } catch (error) {
        console.error(`❌ Error migrating quote amount:`, error.message);
      }
    }

    // Migrate Search History
    console.log('\n🔍 Migrating Search History...');
    const searchHistory = await query('SELECT * FROM SearchHistory');
    console.log(`Found ${searchHistory.length} search history records to migrate`);
    
    for (const record of searchHistory) {
      try {
        await prisma.searchHistory.upsert({
          where: { id: record.id },
          update: {
            query: record.query,
            timestamp: record.timestamp ? new Date(record.timestamp) : new Date(),
            userId: record.userId
          },
          create: {
            id: record.id,
            query: record.query,
            timestamp: record.timestamp ? new Date(record.timestamp) : new Date(),
            userId: record.userId
          }
        });
        console.log(`✅ Search history migrated: ${record.query}`);
      } catch (error) {
        console.error(`❌ Error migrating search history:`, error.message);
      }
    }

    // Migrate Search Analytics
    console.log('\n📊 Migrating Search Analytics...');
    const searchAnalytics = await query('SELECT * FROM SearchAnalytics');
    console.log(`Found ${searchAnalytics.length} search analytics records to migrate`);
    
    for (const record of searchAnalytics) {
      try {
        await prisma.searchAnalytics.upsert({
          where: { id: record.id },
          update: {
            query: record.query,
            timestamp: record.timestamp ? new Date(record.timestamp) : new Date(),
            userId: record.userId
          },
          create: {
            id: record.id,
            query: record.query,
            timestamp: record.timestamp ? new Date(record.timestamp) : new Date(),
            userId: record.userId
          }
        });
        console.log(`✅ Search analytics migrated: ${record.query}`);
      } catch (error) {
        console.error(`❌ Error migrating search analytics:`, error.message);
      }
    }

    console.log('\n🎉 Migration completed successfully!');
    console.log('✅ All your local data has been migrated to Vercel Prisma Accelerate');
    console.log('🌐 Your app now has all your real data!');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    
    if (error.message.includes('Can\'t reach database server')) {
      console.log('\n💡 Possible solutions:');
      console.log('1. Check if your Vercel app is redeployed');
      console.log('2. Verify the connection string is correct');
      console.log('3. Wait a few minutes for database to be ready');
    }
  } finally {
    // Close connections
    if (prisma) {
      await prisma.$disconnect();
    }
    if (sqliteDb) {
      sqliteDb.close();
    }
  }
}

migrateToVercel();
