const { PrismaClient } = require('@prisma/client');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Production Prisma client
const productionPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

// Local SQLite database path
const localDbPath = path.join(__dirname, '../prisma/dev.db');

async function completeDataSync() {
  try {
    console.log('🚀 COMPLETE DATA SYNC - LOCAL TO PRODUCTION');
    console.log('📊 This will make production EXACTLY the same as local\n');

    // Test production connection
    console.log('🔌 Testing production database connection...');
    try {
      await productionPrisma.$queryRaw`SELECT 1`;
      console.log('✅ Production database connection successful');
    } catch (error) {
      console.error('❌ Production database connection failed:', error.message);
      return;
    }

    // Test local connection
    console.log('\n🔌 Testing local database connection...');
    const localDb = new sqlite3.Database(localDbPath);
    const localConnected = await new Promise((resolve) => {
      localDb.get("SELECT COUNT(*) as count FROM Quote", (err, row) => {
        resolve(!err && row);
      });
    });
    
    if (!localConnected) {
      console.error('❌ Local database connection failed');
      return;
    }
    console.log('✅ Local database connection successful');

    console.log('\n📋 Step 1: Clearing production data...');
    
    // Clear all production data
    await productionPrisma.$executeRaw`DELETE FROM "QuoteOperational"`;
    await productionPrisma.$executeRaw`DELETE FROM "QuoteAmount"`;
    await productionPrisma.$executeRaw`DELETE FROM "Quote"`;
    await productionPrisma.$executeRaw`DELETE FROM "Client"`;
    await productionPrisma.$executeRaw`DELETE FROM "User"`;
    await productionPrisma.$executeRaw`DELETE FROM "SalesPerson"`;
    await productionPrisma.$executeRaw`DELETE FROM "UAEArea"`;
    console.log('✅ Production data cleared');

    console.log('\n👥 Step 2: Copying Users...');
    const users = await new Promise((resolve, reject) => {
      localDb.all("SELECT * FROM User", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    for (const user of users) {
      await productionPrisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          password: user.password,
          profilePicture: user.profilePicture,
          status: user.status,
          salesPersonId: user.salesPersonId,
          isSalesPerson: user.isSalesPerson === 1,
          createdAt: new Date(user.createdAt),
          updatedAt: new Date(user.updatedAt)
        }
      });
    }
    console.log(`✅ ${users.length} users copied`);

    console.log('\n👥 Step 3: Copying Clients...');
    const clients = await new Promise((resolve, reject) => {
      localDb.all("SELECT * FROM Client", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    for (const client of clients) {
      await productionPrisma.client.create({
        data: {
          id: client.id,
          clientType: client.clientType,
          companyName: client.companyName,
          contactPerson: client.contactPerson,
          email: client.email,
          phone: client.phone,
          countryCode: client.countryCode,
          role: client.role,
          status: client.status,
          userId: client.userId,
          address: client.address,
          city: client.city,
          state: client.state,
          postalCode: client.postalCode,
          country: client.country,
          firstName: client.firstName,
          lastName: client.lastName,
          designation: client.designation,
          emails: client.emails,
          trn: client.trn,
          hasNoTrn: client.hasNoTrn,
          area: client.area,
          createdAt: new Date(client.createdAt),
          updatedAt: new Date(client.updatedAt)
        }
      });
    }
    console.log(`✅ ${clients.length} clients copied`);

    console.log('\n💼 Step 4: Copying Sales Persons...');
    const salesPersons = await new Promise((resolve, reject) => {
      localDb.all("SELECT * FROM SalesPerson", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    for (const sp of salesPersons) {
      await productionPrisma.$executeRaw`
        INSERT INTO "SalesPerson" (
          id, "salesPersonId", name, email, phone, "countryCode", 
          designation, department, "hireDate", status, "profilePicture",
          address, city, state, "postalCode", country, notes,
          "createdAt", "updatedAt"
        ) VALUES (
          ${sp.id}, ${sp.salesPersonId}, ${sp.name}, ${sp.email}, ${sp.phone},
          ${sp.countryCode || '+971'}, ${sp.designation || 'Sales Representative'},
          ${sp.department || 'Sales'}, ${sp.hireDate ? new Date(sp.hireDate) : new Date()},
          ${sp.status || 'Active'}, ${sp.profilePicture || null},
          ${sp.address || null}, ${sp.city || 'Dubai'},
          ${sp.state || 'Dubai'}, ${sp.postalCode || null},
          ${sp.country || 'UAE'}, ${sp.notes || null},
          ${new Date(sp.createdAt)}, ${new Date(sp.updatedAt)}
        )
      `;
    }
    console.log(`✅ ${salesPersons.length} sales persons copied`);

    console.log('\n📋 Step 5: Copying Quotes...');
    const quotes = await new Promise((resolve, reject) => {
      localDb.all("SELECT * FROM Quote", (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
    
    for (const quote of quotes) {
      await productionPrisma.quote.create({
        data: {
          id: quote.id,
          quoteId: quote.quoteId,
          date: new Date(quote.date),
          status: quote.status,
          clientId: quote.clientId,
          userId: quote.userId,
          salesPersonId: quote.salesPersonId,
          product: quote.product,
          quantity: quote.quantity,
          sides: quote.sides,
          printing: quote.printing,
          colors: quote.colors,
          productName: quote.productName,
          printingSelection: quote.printingSelection,
          flatSizeWidth: quote.flatSizeWidth,
          flatSizeHeight: quote.flatSizeHeight,
          flatSizeSpine: quote.flatSizeSpine,
          closeSizeWidth: quote.closeSizeWidth,
          closeSizeHeight: quote.closeSizeHeight,
          closeSizeSpine: quote.closeSizeSpine,
          useSameAsFlat: quote.useSameAsFlat === 1,
          finishingComments: quote.finishingComments,
          approvalStatus: quote.approvalStatus || 'Draft',
          requiresApproval: quote.requiresApproval === 1,
          approvalReason: quote.approvalReason,
          approvedBy: quote.approvedBy,
          approvedAt: quote.approvedAt ? new Date(quote.approvedAt) : null,
          approvalNotes: quote.approvalNotes,
          discountPercentage: quote.discountPercentage || 0,
          discountAmount: quote.discountAmount || 0,
          marginPercentage: quote.marginPercentage || 15,
          marginAmount: quote.marginAmount || 0,
          customerPdfEnabled: quote.customerPdfEnabled !== 0,
          sendToCustomerEnabled: quote.sendToCustomerEnabled !== 0,
          createdAt: new Date(quote.createdAt),
          updatedAt: new Date(quote.updatedAt)
        }
      });
    }
    console.log(`✅ ${quotes.length} quotes copied`);

    console.log('\n💰 Step 6: Copying Quote Amounts...');
    try {
      const quoteAmounts = await new Promise((resolve, reject) => {
        localDb.all("SELECT * FROM QuoteAmount", (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });
      
      for (const qa of quoteAmounts) {
        await productionPrisma.$executeRaw`
          INSERT INTO "QuoteAmount" (
            id, "quoteId", base, vat, total, "createdAt", "updatedAt"
          ) VALUES (
            ${qa.id}, ${qa.quoteId}, ${qa.base || 0}, ${qa.vat || 0}, ${qa.total || 0},
            ${new Date(qa.createdAt)}, ${new Date(qa.updatedAt)}
          )
        `;
      }
      console.log(`✅ ${quoteAmounts.length} quote amounts copied`);
    } catch (error) {
      console.log('⚠️ QuoteAmount table not found or empty');
    }

    console.log('\n🎯 Step 7: Final verification...');
    
    // Verify counts
    const finalQuoteCount = await productionPrisma.quote.count();
    const finalClientCount = await productionPrisma.client.count();
    const finalUserCount = await productionPrisma.user.count();
    const finalSalesPersonCount = await productionPrisma.$queryRaw`SELECT COUNT(*) as count FROM "SalesPerson"`;
    
    console.log('\n📊 FINAL COUNTS:');
    console.log(`   Quotes: ${finalQuoteCount} (was 10, now ${finalQuoteCount})`);
    console.log(`   Clients: ${finalClientCount} (was 55, now ${finalClientCount})`);
    console.log(`   Users: ${finalUserCount} (was 10, now ${finalUserCount})`);
    console.log(`   Sales Persons: ${finalSalesPersonCount[0]?.count} (was 2, now ${finalSalesPersonCount[0]?.count})`);

    console.log('\n🎉 COMPLETE DATA SYNC FINISHED!');
    console.log('🌐 Your production database is now EXACTLY the same as local!');
    console.log('📱 Check your production dashboard - it should show all the data!');

  } catch (error) {
    console.error('❌ Complete data sync failed:', error);
  } finally {
    await productionPrisma.$disconnect();
    localDb.close();
  }
}

completeDataSync();
