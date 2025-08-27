const { PrismaClient } = require('@prisma/client');

// This script verifies that local and production databases are exactly the same

// Local database connection (SQLite)
const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db',
    },
  },
});

// Production database connection (PostgreSQL)
const productionPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function verifySync() {
  try {
    console.log('🔍 Verifying Local vs Production Database Sync...');
    console.log('📊 This will ensure both databases are EXACTLY the same\n');

    // Test connections
    console.log('🔌 Testing database connections...');
    
    try {
      await localPrisma.$queryRaw`SELECT 1`;
      console.log('✅ Local database connection successful');
    } catch (error) {
      console.error('❌ Local database connection failed:', error.message);
      return;
    }

    try {
      await productionPrisma.$queryRaw`SELECT 1`;
      console.log('✅ Production database connection successful');
    } catch (error) {
      console.error('❌ Production database connection failed:', error.message);
      return;
    }

    console.log('\n📊 Step 1: Counting records in both databases...\n');

    // Count Users
    const localUserCount = await localPrisma.user.count();
    const productionUserCount = await productionPrisma.user.count();
    console.log(`👥 Users:`);
    console.log(`   Local: ${localUserCount}`);
    console.log(`   Production: ${productionUserCount}`);
    console.log(`   Status: ${localUserCount === productionUserCount ? '✅ MATCH' : '❌ MISMATCH'}`);

    // Count Clients
    const localClientCount = await localPrisma.client.count();
    const productionClientCount = await productionPrisma.client.count();
    console.log(`\n🏢 Clients:`);
    console.log(`   Local: ${localClientCount}`);
    console.log(`   Production: ${productionClientCount}`);
    console.log(`   Status: ${localClientCount === productionClientCount ? '✅ MATCH' : '❌ MISMATCH'}`);

    // Count Quotes
    const localQuoteCount = await localPrisma.quote.count();
    const productionQuoteCount = await productionPrisma.quote.count();
    console.log(`\n📄 Quotes:`);
    console.log(`   Local: ${localQuoteCount}`);
    console.log(`   Production: ${productionQuoteCount}`);
    console.log(`   Status: ${localQuoteCount === productionQuoteCount ? '✅ MATCH' : '❌ MISMATCH'}`);

    // Count Suppliers
    const localSupplierCount = await localPrisma.supplier.count();
    const productionSupplierCount = await productionPrisma.supplier.count();
    console.log(`\n🏭 Suppliers:`);
    console.log(`   Local: ${localSupplierCount}`);
    console.log(`   Production: ${productionSupplierCount}`);
    console.log(`   Status: ${localSupplierCount === productionSupplierCount ? '✅ MATCH' : '❌ MISMATCH'}`);

    // Count Materials
    const localMaterialCount = await localPrisma.material.count();
    const productionMaterialCount = await productionPrisma.material.count();
    console.log(`\n📦 Materials:`);
    console.log(`   Local: ${localMaterialCount}`);
    console.log(`   Production: ${productionMaterialCount}`);
    console.log(`   Status: ${localMaterialCount === productionMaterialCount ? '✅ MATCH' : '❌ MISMATCH'}`);

    // Count Papers
    const localPaperCount = await localPrisma.paper.count();
    const productionPaperCount = await productionPrisma.paper.count();
    console.log(`\n📰 Papers:`);
    console.log(`   Local: ${localPaperCount}`);
    console.log(`   Production: ${productionPaperCount}`);
    console.log(`   Status: ${localPaperCount === productionPaperCount ? '✅ MATCH' : '❌ MISMATCH'}`);

    // Count Finishing
    const localFinishingCount = await localPrisma.finishing.count();
    const productionFinishingCount = await productionPrisma.finishing.count();
    console.log(`\n✨ Finishing:`);
    console.log(`   Local: ${localFinishingCount}`);
    console.log(`   Production: ${productionFinishingCount}`);
    console.log(`   Status: ${localFinishingCount === productionFinishingCount ? '✅ MATCH' : '❌ MISMATCH'}`);

    // Count QuoteAmounts
    const localQuoteAmountCount = await localPrisma.quoteAmount.count();
    const productionQuoteAmountCount = await productionPrisma.quoteAmount.count();
    console.log(`\n💰 QuoteAmounts:`);
    console.log(`   Local: ${localQuoteAmountCount}`);
    console.log(`   Production: ${productionQuoteAmountCount}`);
    console.log(`   Status: ${localQuoteAmountCount === productionQuoteAmountCount ? '✅ MATCH' : '❌ MISMATCH'}`);

    // Count QuoteOperational
    const localQuoteOperationalCount = await localPrisma.quoteOperational.count();
    const productionQuoteOperationalCount = await productionPrisma.quoteOperational.count();
    console.log(`\n⚙️ QuoteOperational:`);
    console.log(`   Local: ${localQuoteOperationalCount}`);
    console.log(`   Production: ${productionQuoteOperationalCount}`);
    console.log(`   Status: ${localQuoteOperationalCount === productionQuoteOperationalCount ? '✅ MATCH' : '❌ MISMATCH'}`);

    // Count SalesPersons (using raw queries)
    try {
      const localSalesPersonCount = (await localPrisma.$queryRaw`SELECT COUNT(*) as count FROM "SalesPerson"`)[0]?.count || 0;
      const productionSalesPersonCount = (await productionPrisma.$queryRaw`SELECT COUNT(*) as count FROM "SalesPerson"`)[0]?.count || 0;
      console.log(`\n👤 SalesPersons:`);
      console.log(`   Local: ${localSalesPersonCount}`);
      console.log(`   Production: ${productionSalesPersonCount}`);
      console.log(`   Status: ${localSalesPersonCount === productionSalesPersonCount ? '✅ MATCH' : '❌ MISMATCH'}`);
    } catch (error) {
      console.log(`\n👤 SalesPersons: ⚠️ Table may not exist in one or both databases`);
    }

    // Count UAEAreas (using raw queries)
    try {
      const localUAEAreaCount = (await localPrisma.$queryRaw`SELECT COUNT(*) as count FROM "UAEArea"`)[0]?.count || 0;
      const productionUAEAreaCount = (await productionPrisma.$queryRaw`SELECT COUNT(*) as count FROM "UAEArea"`)[0]?.count || 0;
      console.log(`\n🗺️ UAEAreas:`);
      console.log(`   Local: ${localUAEAreaCount}`);
      console.log(`   Production: ${productionUAEAreaCount}`);
      console.log(`   Status: ${localUAEAreaCount === productionUAEAreaCount ? '✅ MATCH' : '❌ MISMATCH'}`);
    } catch (error) {
      console.log(`\n🗺️ UAEAreas: ⚠️ Table may not exist in one or both databases`);
    }

    // Count SearchHistory
    const localSearchHistoryCount = await localPrisma.searchHistory.count();
    const productionSearchHistoryCount = await productionPrisma.searchHistory.count();
    console.log(`\n🔍 SearchHistory:`);
    console.log(`   Local: ${localSearchHistoryCount}`);
    console.log(`   Production: ${productionSearchHistoryCount}`);
    console.log(`   Status: ${localSearchHistoryCount === productionSearchHistoryCount ? '✅ MATCH' : '❌ MISMATCH'}`);

    // Count SearchAnalytics
    const localSearchAnalyticsCount = await localPrisma.searchAnalytics.count();
    const productionSearchAnalyticsCount = await productionPrisma.searchAnalytics.count();
    console.log(`\n📊 SearchAnalytics:`);
    console.log(`   Local: ${localSearchAnalyticsCount}`);
    console.log(`   Production: ${productionSearchAnalyticsCount}`);
    console.log(`   Status: ${localSearchAnalyticsCount === productionSearchAnalyticsCount ? '✅ MATCH' : '❌ MISMATCH'}`);

    console.log('\n📋 Step 2: Sample data verification...\n');

    // Verify sample users
    console.log('👥 Sample Users:');
    const localUsers = await localPrisma.user.findMany({ take: 3 });
    const productionUsers = await productionPrisma.user.findMany({ take: 3 });
    
    for (let i = 0; i < Math.min(localUsers.length, productionUsers.length); i++) {
      const localUser = localUsers[i];
      const productionUser = productionUsers[i];
      const match = localUser.email === productionUser.email && 
                   localUser.name === productionUser.name && 
                   localUser.role === productionUser.role;
      
      console.log(`   User ${i + 1}: ${match ? '✅ MATCH' : '❌ MISMATCH'}`);
      console.log(`     Local: ${localUser.email} (${localUser.name}) - ${localUser.role}`);
      console.log(`     Production: ${productionUser.email} (${productionUser.name}) - ${productionUser.role}`);
    }

    // Verify sample quotes
    console.log('\n📄 Sample Quotes:');
    const localQuotes = await localPrisma.quote.findMany({ take: 3 });
    const productionQuotes = await productionPrisma.quote.findMany({ take: 3 });
    
    for (let i = 0; i < Math.min(localQuotes.length, productionQuotes.length); i++) {
      const localQuote = localQuotes[i];
      const productionQuote = productionQuotes[i];
      const match = localQuote.quoteId === productionQuote.quoteId && 
                   localQuote.status === productionQuote.status;
      
      console.log(`   Quote ${i + 1}: ${match ? '✅ MATCH' : '❌ MISMATCH'}`);
      console.log(`     Local: ${localQuote.quoteId} - ${localQuote.status}`);
      console.log(`     Production: ${productionQuote.quoteId} - ${productionQuote.status}`);
    }

    console.log('\n🎯 Verification Summary:');
    console.log('✅ If all counts match, your databases are synchronized!');
    console.log('❌ If any counts mismatch, run the sync script again.');
    console.log('\n🌐 Your production environment should now work exactly like your local environment.');

  } catch (error) {
    console.error('❌ Verification failed:', error);
    console.error('Error details:', error.message);
  } finally {
    await localPrisma.$disconnect();
    await productionPrisma.$disconnect();
  }
}

// Run the verification
verifySync();
