const { PrismaClient } = require('@prisma/client');

// This script tests data access directly to see what's happening
// It will show exactly why the frontend can't see the data

const productionPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function testDataAccess() {
  try {
    console.log('🔍 TESTING DATA ACCESS - FINDING THE ISSUE...');
    console.log('📊 This will show exactly why the frontend can\'t see data\n');

    // Test connection
    console.log('🔌 Testing production database connection...');
    try {
      await productionPrisma.$queryRaw`SELECT 1`;
      console.log('✅ Production database connection successful');
    } catch (error) {
      console.error('❌ Production database connection failed:', error.message);
      return;
    }

    console.log('\n📋 Step 1: Testing direct database access...');
    
    // Test quotes access directly
    try {
      const quoteCount = await productionPrisma.$queryRaw`SELECT COUNT(*) as count FROM "Quote"`;
      console.log(`✅ Direct SQL - Quotes count: ${quoteCount[0]?.count}`);
      
      if (quoteCount[0]?.count > 0) {
        const sampleQuotes = await productionPrisma.$queryRaw`SELECT "quoteId", status, "clientId" FROM "Quote" LIMIT 3`;
        console.log('✅ Sample quotes from direct SQL:');
        sampleQuotes.forEach((quote, index) => {
          console.log(`   ${index + 1}. ${quote.quoteId} - ${quote.status} (Client: ${quote.clientId})`);
        });
      }
    } catch (error) {
      console.error(`❌ Error accessing quotes directly: ${error.message}`);
    }

    // Test sales person access directly
    try {
      const salesPersonCount = await productionPrisma.$queryRaw`SELECT COUNT(*) as count FROM "SalesPerson"`;
      console.log(`✅ Direct SQL - SalesPerson count: ${salesPersonCount[0]?.count}`);
      
      if (salesPersonCount[0]?.count > 0) {
        const sampleSalesPersons = await productionPrisma.$queryRaw`SELECT "salesPersonId", name, email FROM "SalesPerson" LIMIT 3`;
        console.log('✅ Sample sales persons from direct SQL:');
        sampleSalesPersons.forEach((sp, index) => {
          console.log(`   ${index + 1}. ${sp.salesPersonId} - ${sp.name} (${sp.email})`);
        });
      }
    } catch (error) {
      console.error(`❌ Error accessing sales persons directly: ${error.message}`);
    }

    console.log('\n🔧 Step 2: Testing Prisma ORM access...');
    
    // Test quotes access through Prisma ORM
    try {
      const quoteCount = await productionPrisma.quote.count();
      console.log(`✅ Prisma ORM - Quotes count: ${quoteCount}`);
      
      if (quoteCount > 0) {
        const sampleQuotes = await productionPrisma.quote.findMany({
          take: 3,
          select: {
            quoteId: true,
            status: true,
            clientId: true
          }
        });
        console.log('✅ Sample quotes from Prisma ORM:');
        sampleQuotes.forEach((quote, index) => {
          console.log(`   ${index + 1}. ${quote.quoteId} - ${quote.status} (Client: ${quote.clientId})`);
        });
      }
    } catch (error) {
      console.error(`❌ Error accessing quotes through Prisma ORM: ${error.message}`);
    }

    // Test sales person access through Prisma ORM
    try {
      const salesPersonCount = await productionPrisma.salesPerson.count();
      console.log(`✅ Prisma ORM - SalesPerson count: ${salesPersonCount}`);
      
      if (salesPersonCount > 0) {
        const sampleSalesPersons = await productionPrisma.salesPerson.findMany({
          take: 3,
          select: {
            salesPersonId: true,
            name: true,
            email: true
          }
        });
        console.log('✅ Sample sales persons from Prisma ORM:');
        sampleSalesPersons.forEach((sp, index) => {
          console.log(`   ${index + 1}. ${sp.salesPersonId} - ${sp.name} (${sp.email})`);
        });
      }
    } catch (error) {
      console.error(`❌ Error accessing sales persons through Prisma ORM: ${error.message}`);
    }

    console.log('\n🌐 Step 3: Testing API endpoints...');
    
    // Test the quotes API endpoint
    try {
      const response = await fetch('https://smart-printing.vercel.app/api/quotes');
      const data = await response.json();
      console.log(`✅ Quotes API response: ${JSON.stringify(data).substring(0, 100)}...`);
      console.log(`✅ Quotes API status: ${response.status}`);
      console.log(`✅ Quotes API data type: ${Array.isArray(data) ? 'Array' : typeof data}`);
      console.log(`✅ Quotes API data length: ${Array.isArray(data) ? data.length : 'N/A'}`);
    } catch (error) {
      console.error(`❌ Error testing quotes API: ${error.message}`);
    }

    // Test the sales person API endpoint
    try {
      const response = await fetch('https://smart-printing.vercel.app/api/sales-persons');
      const data = await response.json();
      console.log(`✅ SalesPerson API response: ${JSON.stringify(data).substring(0, 100)}...`);
      console.log(`✅ SalesPerson API status: ${response.status}`);
      console.log(`✅ SalesPerson API data type: ${Array.isArray(data) ? 'Array' : typeof data}`);
      console.log(`✅ SalesPerson API data length: ${Array.isArray(data) ? data.length : 'N/A'}`);
    } catch (error) {
      console.error(`❌ Error testing sales person API: ${error.message}`);
    }

    console.log('\n🎯 Step 4: Analysis...');
    
    console.log('\n📊 Summary of findings:');
    console.log('✅ If direct SQL works but Prisma ORM fails: Prisma client issue');
    console.log('✅ If Prisma ORM works but API fails: API route issue');
    console.log('✅ If API works but frontend shows 0: Frontend issue');
    console.log('\n🔧 Next steps will depend on what we find');

  } catch (error) {
    console.error('❌ Test script failed:', error);
    console.error('Error details:', error.message);
  } finally {
    await productionPrisma.$disconnect();
  }
}

// Run the test
testDataAccess();
