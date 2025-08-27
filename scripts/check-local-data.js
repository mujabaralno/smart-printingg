const { PrismaClient } = require('@prisma/client');

const localPrisma = new PrismaClient({
  datasources: {
    db: {
      url: 'file:./prisma/dev.db',
    },
  },
});

async function checkLocalData() {
  try {
    console.log('🔍 CHECKING LOCAL DATABASE DATA...');
    console.log('📊 This will show exactly what\'s in your local database\n');

    // Check quotes
    const quoteCount = await localPrisma.quote.count();
    console.log(`📋 Quotes: ${quoteCount} total`);
    
    if (quoteCount > 0) {
      const sampleQuotes = await localPrisma.quote.findMany({
        take: 5,
        select: {
          quoteId: true,
          status: true,
          clientId: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });
      console.log('✅ Sample quotes:');
      sampleQuotes.forEach((quote, index) => {
        console.log(`   ${index + 1}. ${quote.quoteId} - ${quote.status} (${quote.createdAt.toDateString()})`);
      });
    }

    // Check clients
    const clientCount = await localPrisma.client.count();
    console.log(`\n👥 Clients: ${clientCount} total`);
    
    if (clientCount > 0) {
      const sampleClients = await localPrisma.client.findMany({
        take: 5,
        select: {
          companyName: true,
          contactPerson: true,
          email: true
        }
      });
      console.log('✅ Sample clients:');
      sampleClients.forEach((client, index) => {
        console.log(`   ${index + 1}. ${client.companyName || 'N/A'} - ${client.contactPerson} (${client.email})`);
      });
    }

    // Check users
    const userCount = await localPrisma.user.count();
    console.log(`\n👤 Users: ${userCount} total`);
    
    if (userCount > 0) {
      const sampleUsers = await localPrisma.user.findMany({
        take: 5,
        select: {
          name: true,
          email: true,
          role: true
        }
      });
      console.log('✅ Sample users:');
      sampleUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.name} - ${user.email} (${user.role})`);
      });
    }

    // Check sales persons
    try {
      const salesPersonCount = await localPrisma.salesPerson.count();
      console.log(`\n💼 Sales Persons: ${salesPersonCount} total`);
      
      if (salesPersonCount > 0) {
        const sampleSalesPersons = await localPrisma.salesPerson.findMany({
          take: 5,
          select: {
            salesPersonId: true,
            name: true,
            email: true,
            designation: true
          }
        });
        console.log('✅ Sample sales persons:');
        sampleSalesPersons.forEach((sp, index) => {
          console.log(`   ${index + 1}. ${sp.salesPersonId} - ${sp.name} (${sp.designation})`);
        });
      }
    } catch (error) {
      console.log(`❌ SalesPerson table not accessible: ${error.message}`);
    }

    console.log('\n📊 SUMMARY:');
    console.log(`   Quotes: ${quoteCount}`);
    console.log(`   Clients: ${clientCount}`);
    console.log(`   Users: ${userCount}`);
    console.log(`   Sales Persons: ${salesPersonCount || 'N/A'}`);

  } catch (error) {
    console.error('❌ Error checking local data:', error);
  } finally {
    await localPrisma.$disconnect();
  }
}

checkLocalData();
