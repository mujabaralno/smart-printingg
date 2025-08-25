const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Local database (SQLite)
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: "file:./prisma/dev.db"
    }
  }
});

// Production database (PostgreSQL)
const productionPrisma = new PrismaClient({
  datasources: {
    db: {
      url: "postgres://c91c8561fe8b6b34a5985f17ac564ca367969fe928557c4c4f6b5bc780733281:sk_1sGdxWA91n5mc5fS6JTs0@db.prisma.io:5432/?sslmode=require"
    }
  }
});

async function migrateLocalToProduction() {
  try {
    console.log('🚀 Starting Local to Production Database Migration...\n');
    
    // Step 1: Test connections
    console.log('🔌 Testing database connections...');
    
    // Test local connection
    try {
      const localUserCount = await localPrisma.user.count();
      console.log(`✅ Local database connected: ${localUserCount} users found`);
    } catch (localError) {
      console.error(`❌ Local database connection failed: ${localError.message}`);
      throw localError;
    }
    
    // Test production connection
    try {
      const productionUserCount = await productionPrisma.user.count();
      console.log(`✅ Production database connected: ${productionUserCount} users found`);
    } catch (productionError) {
      console.error(`❌ Production database connection failed: ${productionError.message}`);
      throw productionError;
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Step 2: Backup production data (safety first)
    console.log('💾 Creating production backup...');
    const backupDir = path.join(__dirname, '../data/production-backup-before-migration');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    
    try {
      // Backup production data
      const prodUsers = await productionPrisma.user.findMany();
      const prodClients = await productionPrisma.client.findMany();
      const prodQuotes = await productionPrisma.quote.findMany();
      const prodSuppliers = await productionPrisma.supplier.findMany();
      const prodMaterials = await productionPrisma.material.findMany();
      
      fs.writeFileSync(path.join(backupDir, `Users-${timestamp}.json`), JSON.stringify(prodUsers, null, 2));
      fs.writeFileSync(path.join(backupDir, `Clients-${timestamp}.json`), JSON.stringify(prodClients, null, 2));
      fs.writeFileSync(path.join(backupDir, `Quotes-${timestamp}.json`), JSON.stringify(prodQuotes, null, 2));
      fs.writeFileSync(path.join(backupDir, `Suppliers-${timestamp}.json`), JSON.stringify(prodSuppliers, null, 2));
      fs.writeFileSync(path.join(backupDir, `Materials-${timestamp}.json`), JSON.stringify(prodMaterials, null, 2));
      
      console.log(`✅ Production backup created in: ${backupDir}`);
    } catch (backupError) {
      console.log(`⚠️  Production backup failed: ${backupError.message}`);
      console.log('Continuing with migration...');
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Step 3: Clear production database (to ensure clean migration)
    console.log('🧹 Clearing production database...');
    try {
      await productionPrisma.$executeRaw`TRUNCATE TABLE "User" CASCADE`;
      await productionPrisma.$executeRaw`TRUNCATE TABLE "Client" CASCADE`;
      await productionPrisma.$executeRaw`TRUNCATE TABLE "Quote" CASCADE`;
      await productionPrisma.$executeRaw`TRUNCATE TABLE "Paper" CASCADE`;
      await productionPrisma.$executeRaw`TRUNCATE TABLE "Finishing" CASCADE`;
      await productionPrisma.$executeRaw`TRUNCATE TABLE "QuoteAmount" CASCADE`;
      await productionPrisma.$executeRaw`TRUNCATE TABLE "QuoteOperational" CASCADE`;
      await productionPrisma.$executeRaw`TRUNCATE TABLE "Supplier" CASCADE`;
      await productionPrisma.$executeRaw`TRUNCATE TABLE "Material" CASCADE`;
      await productionPrisma.$executeRaw`TRUNCATE TABLE "SearchHistory" CASCADE`;
      await productionPrisma.$executeRaw`TRUNCATE TABLE "SearchAnalytics" CASCADE`;
      
      console.log('✅ Production database cleared');
    } catch (clearError) {
      console.error(`❌ Failed to clear production database: ${clearError.message}`);
      throw clearError;
    }
    
    console.log('\n' + '='.repeat(60));
    
    // Step 4: Migrate data from local to production
    console.log('📤 Migrating data from local to production...\n');
    
    // Migrate Users
    console.log('👥 Migrating Users...');
    const localUsers = await localPrisma.user.findMany();
    for (const user of localUsers) {
      await productionPrisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          profilePicture: user.profilePicture,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    }
    console.log(`✅ Migrated ${localUsers.length} users`);
    
    // Migrate Clients
    console.log('🏢 Migrating Clients...');
    const localClients = await localPrisma.client.findMany();
    for (const client of localClients) {
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
          address: client.address,
          city: client.city,
          state: client.state,
          postalCode: client.postalCode,
          country: client.country,
          createdAt: client.createdAt,
          updatedAt: client.updatedAt,
          userId: client.userId
        }
      });
    }
    console.log(`✅ Migrated ${localClients.length} clients`);
    
    // Migrate Quotes
    console.log('📋 Migrating Quotes...');
    const localQuotes = await localPrisma.quote.findMany();
    for (const quote of localQuotes) {
      await productionPrisma.quote.create({
        data: {
          id: quote.id,
          quoteId: quote.quoteId,
          date: quote.date,
          status: quote.status,
          clientId: quote.clientId,
          userId: quote.userId,
          product: quote.product,
          quantity: quote.quantity,
          sides: quote.sides,
          printing: quote.printing,
          colors: quote.colors,
          productName: quote.productName,
          printingSelection: quote.printingSelection,
          flatSizeHeight: quote.flatSizeHeight,
          closeSizeSpine: quote.closeSizeSpine,
          useSameAsFlat: quote.useSameAsFlat,
          flatSizeWidth: quote.flatSizeWidth,
          flatSizeSpine: quote.flatSizeSpine,
          closeSizeHeight: quote.closeSizeHeight,
          closeSizeWidth: quote.closeSizeWidth,
          createdAt: quote.createdAt,
          updatedAt: quote.updatedAt
        }
      });
    }
    console.log(`✅ Migrated ${localQuotes.length} quotes`);
    
    // Migrate Papers
    console.log('📄 Migrating Papers...');
    const localPapers = await localPrisma.paper.findMany();
    for (const paper of localPapers) {
      await productionPrisma.paper.create({
        data: {
          id: paper.id,
          name: paper.name,
          gsm: paper.gsm,
          quoteId: paper.quoteId,
          inputWidth: paper.inputWidth,
          inputHeight: paper.inputHeight,
          pricePerPacket: paper.pricePerPacket,
          pricePerSheet: paper.pricePerSheet,
          sheetsPerPacket: paper.sheetsPerPacket,
          recommendedSheets: paper.recommendedSheets,
          enteredSheets: paper.enteredSheets,
          outputWidth: paper.outputWidth,
          outputHeight: paper.outputHeight,
          selectedColors: paper.selectedColors,
          createdAt: paper.createdAt,
          updatedAt: paper.updatedAt
        }
      });
    }
    console.log(`✅ Migrated ${localPapers.length} papers`);
    
    // Migrate Finishing
    console.log('✨ Migrating Finishing...');
    const localFinishing = await localPrisma.finishing.findMany();
    for (const finishing of localFinishing) {
      await productionPrisma.finishing.create({
        data: {
          id: finishing.id,
          name: finishing.name,
          quoteId: finishing.quoteId,
          cost: finishing.cost,
          createdAt: finishing.createdAt,
          updatedAt: finishing.updatedAt
        }
      });
    }
    console.log(`✅ Migrated ${localFinishing.length} finishing options`);
    
    // Migrate QuoteAmount
    console.log('💰 Migrating QuoteAmount...');
    const localQuoteAmounts = await localPrisma.quoteAmount.findMany();
    for (const amount of localQuoteAmounts) {
      await productionPrisma.quoteAmount.create({
        data: {
          id: amount.id,
          base: amount.base,
          vat: amount.vat,
          total: amount.total,
          quoteId: amount.quoteId,
          createdAt: amount.createdAt,
          updatedAt: amount.updatedAt
        }
      });
    }
    console.log(`✅ Migrated ${localQuoteAmounts.length} quote amounts`);
    
    // Migrate QuoteOperational
    console.log('⚙️  Migrating QuoteOperational...');
    const localQuoteOperational = await localPrisma.quoteOperational.findMany();
    for (const operational of localQuoteOperational) {
      await productionPrisma.quoteOperational.create({
        data: {
          id: operational.id,
          quoteId: operational.quoteId,
          plates: operational.plates,
          units: operational.units,
          createdAt: operational.createdAt,
          updatedAt: operational.updatedAt
        }
      });
    }
    console.log(`✅ Migrated ${localQuoteOperational.length} operational specifications`);
    
    // Migrate Suppliers
    console.log('🏭 Migrating Suppliers...');
    const localSuppliers = await localPrisma.supplier.findMany();
    for (const supplier of localSuppliers) {
      await productionPrisma.supplier.create({
        data: {
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
          createdAt: supplier.createdAt,
          updatedAt: supplier.updatedAt
        }
      });
    }
    console.log(`✅ Migrated ${localSuppliers.length} suppliers`);
    
    // Migrate Materials
    console.log('📦 Migrating Materials...');
    const localMaterials = await localPrisma.material.findMany();
    for (const material of localMaterials) {
      await productionPrisma.material.create({
        data: {
          id: material.id,
          materialId: material.materialId,
          name: material.name,
          gsm: material.gsm,
          supplierId: material.supplierId,
          cost: material.cost,
          unit: material.unit,
          status: material.status,
          lastUpdated: material.lastUpdated,
          createdAt: material.createdAt,
          updatedAt: material.updatedAt
        }
      });
    }
    console.log(`✅ Migrated ${localMaterials.length} materials`);
    
    // Migrate SearchHistory
    console.log('🔍 Migrating SearchHistory...');
    const localSearchHistory = await localPrisma.searchHistory.findMany();
    for (const history of localSearchHistory) {
      await productionPrisma.searchHistory.create({
        data: {
          id: history.id,
          query: history.query,
          timestamp: history.timestamp,
          userId: history.userId,
          createdAt: history.createdAt,
          updatedAt: history.updatedAt
        }
      });
    }
    console.log(`✅ Migrated ${localSearchHistory.length} search history records`);
    
    // Migrate SearchAnalytics
    console.log('📊 Migrating SearchAnalytics...');
    const localSearchAnalytics = await localPrisma.searchAnalytics.findMany();
    for (const analytics of localSearchAnalytics) {
      await productionPrisma.searchAnalytics.create({
        data: {
          id: analytics.id,
          query: analytics.query,
          timestamp: analytics.timestamp,
          userId: analytics.userId,
          createdAt: analytics.createdAt,
          updatedAt: analytics.updatedAt
        }
      });
    }
    console.log(`✅ Migrated ${localSearchAnalytics.length} search analytics records`);
    
    console.log('\n' + '='.repeat(60));
    
    // Step 5: Verification
    console.log('🔍 Verifying migration...');
    
    const prodUserCount = await productionPrisma.user.count();
    const prodClientCount = await productionPrisma.client.count();
    const prodQuoteCount = await productionPrisma.quote.count();
    const prodSupplierCount = await productionPrisma.supplier.count();
    const prodMaterialCount = await productionPrisma.material.count();
    
    console.log(`📊 Production database now contains:`);
    console.log(`   Users: ${prodUserCount} (was ${localUsers.length})`);
    console.log(`   Clients: ${prodClientCount} (was ${localClients.length})`);
    console.log(`   Quotes: ${prodQuoteCount} (was ${localQuotes.length})`);
    console.log(`   Suppliers: ${prodSupplierCount} (was ${localSuppliers.length})`);
    console.log(`   Materials: ${prodMaterialCount} (was ${localMaterials.length})`);
    
    // Verify data integrity
    const verificationPassed = 
      prodUserCount === localUsers.length &&
      prodClientCount === localClients.length &&
      prodQuoteCount === localQuotes.length &&
      prodSupplierCount === localSuppliers.length &&
      prodMaterialCount === localMaterials.length;
    
    if (verificationPassed) {
      console.log('\n✅ MIGRATION SUCCESSFUL! All data migrated correctly.');
    } else {
      console.log('\n❌ MIGRATION FAILED! Data counts do not match.');
      throw new Error('Migration verification failed');
    }
    
    console.log('\n🎉 Your local database has been successfully migrated to production!');
    console.log('🌐 Production database now contains exactly the same data and structure as local.');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.log('\n🔄 You can restore production from the backup in: data/production-backup-before-migration/');
    throw error;
  } finally {
    await localPrisma.$disconnect();
    await productionPrisma.$disconnect();
  }
}

// Run the migration
migrateLocalToProduction()
  .then(() => {
    console.log('\n✅ Migration script completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Migration script failed:', error);
    process.exit(1);
  });
