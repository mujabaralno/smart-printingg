const { PrismaClient } = require('@prisma/client');

// This script fixes all production database issues
// It ensures the correct PostgreSQL schema is used and all tables exist

const productionPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function fixProductionDatabase() {
  try {
    console.log('🔧 Fixing Production Database Issues...');
    console.log('📊 This will ensure all tables exist and data is accessible\n');

    // Test connection
    console.log('🔌 Testing production database connection...');
    try {
      await productionPrisma.$queryRaw`SELECT 1`;
      console.log('✅ Production database connection successful');
    } catch (error) {
      console.error('❌ Production database connection failed:', error.message);
      return;
    }

    console.log('\n📋 Step 1: Checking current database structure...');
    
    // Get current tables
    const tables = await productionPrisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('Current tables in production:');
    tables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });

    console.log('\n📝 Step 2: Creating missing tables...');
    
    // Create SalesPerson table if it doesn't exist
    try {
      await productionPrisma.$queryRaw`SELECT * FROM "SalesPerson" LIMIT 1`;
      console.log('✅ SalesPerson table already exists');
    } catch (error) {
      console.log('📝 Creating SalesPerson table...');
      await productionPrisma.$executeRaw`
        CREATE TABLE "SalesPerson" (
          "id" TEXT NOT NULL,
          "salesPersonId" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "phone" TEXT NOT NULL,
          "countryCode" TEXT NOT NULL DEFAULT '+971',
          "designation" TEXT NOT NULL DEFAULT 'Sales Representative',
          "department" TEXT NOT NULL DEFAULT 'Sales',
          "hireDate" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "status" TEXT NOT NULL DEFAULT 'Active',
          "profilePicture" TEXT,
          "address" TEXT,
          "city" TEXT NOT NULL DEFAULT 'Dubai',
          "state" TEXT NOT NULL DEFAULT 'Dubai',
          "postalCode" TEXT,
          "country" TEXT NOT NULL DEFAULT 'UAE',
          "notes" TEXT,
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "SalesPerson_pkey" PRIMARY KEY ("id")
        )
      `;
      
      // Create unique indexes
      await productionPrisma.$executeRaw`CREATE UNIQUE INDEX "SalesPerson_salesPersonId_key" ON "SalesPerson"("salesPersonId")`;
      await productionPrisma.$executeRaw`CREATE UNIQUE INDEX "SalesPerson_email_key" ON "SalesPerson"("email")`;
      console.log('✅ SalesPerson table created');
    }

    // Create UAEArea table if it doesn't exist
    try {
      await productionPrisma.$queryRaw`SELECT * FROM "UAEArea" LIMIT 1`;
      console.log('✅ UAEArea table already exists');
    } catch (error) {
      console.log('📝 Creating UAEArea table...');
      await productionPrisma.$executeRaw`
        CREATE TABLE "UAEArea" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "state" TEXT NOT NULL,
          "country" TEXT NOT NULL DEFAULT 'UAE',
          "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
          CONSTRAINT "UAEArea_pkey" PRIMARY KEY ("id")
        )
      `;
      console.log('✅ UAEArea table created');
    }

    console.log('\n🔧 Step 3: Adding missing columns to existing tables...');
    
    // Add missing columns to User table
    const userColumns = ['salesPersonId', 'isSalesPerson'];
    for (const column of userColumns) {
      try {
        await productionPrisma.$queryRaw`SELECT "${column}" FROM "User" LIMIT 1`;
        console.log(`✅ User table already has ${column} column`);
      } catch (error) {
        console.log(`📝 Adding ${column} column to User table...`);
        if (column === 'isSalesPerson') {
          await productionPrisma.$executeRaw`ALTER TABLE "User" ADD COLUMN "${column}" BOOLEAN DEFAULT false`;
        } else {
          await productionPrisma.$executeRaw`ALTER TABLE "User" ADD COLUMN "${column}" TEXT`;
        }
        console.log(`✅ ${column} column added to User table`);
      }
    }

    // Add missing columns to Client table
    const clientColumns = ['firstName', 'lastName', 'designation', 'emails', 'trn', 'hasNoTrn', 'area'];
    for (const column of clientColumns) {
      try {
        await productionPrisma.$queryRaw`SELECT "${column}" FROM "Client" LIMIT 1`;
        console.log(`✅ Client table already has ${column} column`);
      } catch (error) {
        console.log(`📝 Adding ${column} column to Client table...`);
        if (column === 'hasNoTrn') {
          await productionPrisma.$executeRaw`ALTER TABLE "Client" ADD COLUMN "${column}" INTEGER DEFAULT 0`;
        } else {
          await productionPrisma.$executeRaw`ALTER TABLE "Client" ADD COLUMN "${column}" TEXT`;
        }
        console.log(`✅ ${column} column added to Client table`);
      }
    }

    // Add missing columns to Quote table
    const quoteColumns = [
      'salesPersonId', 'finishingComments', 'approvalStatus', 'requiresApproval',
      'approvalReason', 'approvedBy', 'approvedAt', 'approvalNotes',
      'discountPercentage', 'discountAmount', 'marginPercentage', 'marginAmount',
      'customerPdfEnabled', 'sendToCustomerEnabled'
    ];
    
    for (const column of quoteColumns) {
      try {
        await productionPrisma.$queryRaw`SELECT "${column}" FROM "Quote" LIMIT 1`;
        console.log(`✅ Quote table already has ${column} column`);
      } catch (error) {
        console.log(`📝 Adding ${column} column to Quote table...`);
        if (column === 'requiresApproval' || column === 'customerPdfEnabled' || column === 'sendToCustomerEnabled') {
          await productionPrisma.$executeRaw`ALTER TABLE "Quote" ADD COLUMN "${column}" BOOLEAN DEFAULT false`;
        } else if (column === 'discountPercentage' || column === 'marginPercentage') {
          await productionPrisma.$executeRaw`ALTER TABLE "Quote" ADD COLUMN "${column}" REAL DEFAULT 0`;
        } else if (column === 'discountAmount' || column === 'marginAmount') {
          await productionPrisma.$executeRaw`ALTER TABLE "Quote" ADD COLUMN "${column}" REAL DEFAULT 0`;
        } else if (column === 'approvedAt') {
          await productionPrisma.$executeRaw`ALTER TABLE "Quote" ADD COLUMN "${column}" TIMESTAMP`;
        } else {
          await productionPrisma.$executeRaw`ALTER TABLE "Quote" ADD COLUMN "${column}" TEXT`;
        }
        console.log(`✅ ${column} column added to Quote table`);
      }
    }

    console.log('\n📊 Step 4: Verifying data accessibility...');
    
    // Test if we can access quotes
    try {
      const quoteCount = await productionPrisma.$queryRaw`SELECT COUNT(*) as count FROM "Quote"`;
      console.log(`✅ Quotes accessible: ${quoteCount[0]?.count || 0} quotes found`);
    } catch (error) {
      console.error(`❌ Error accessing quotes: ${error.message}`);
    }

    // Test if we can access users
    try {
      const userCount = await productionPrisma.$queryRaw`SELECT COUNT(*) as count FROM "User"`;
      console.log(`✅ Users accessible: ${userCount[0]?.count || 0} users found`);
    } catch (error) {
      console.error(`❌ Error accessing users: ${error.message}`);
    }

    // Test if we can access clients
    try {
      const clientCount = await productionPrisma.$queryRaw`SELECT COUNT(*) as count FROM "Client"`;
      console.log(`✅ Clients accessible: ${clientCount[0]?.count || 0} clients found`);
    } catch (error) {
      console.error(`❌ Error accessing clients: ${error.message}`);
    }

    console.log('\n🎯 Step 5: Final verification...');
    
    // Get updated table list
    const updatedTables = await productionPrisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('\nUpdated tables in production:');
    updatedTables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });

    console.log('\n🎉 Production database fix completed!');
    console.log('\n📋 Next steps:');
    console.log('1. Wait for Vercel to redeploy (2-5 minutes)');
    console.log('2. Check if dashboard now shows data');
    console.log('3. If still empty, run the sync script to copy local data');
    console.log('4. Verify all features are working');

  } catch (error) {
    console.error('❌ Production database fix failed:', error);
    console.error('Error details:', error.message);
  } finally {
    await productionPrisma.$disconnect();
  }
}

// Run the fix
fixProductionDatabase();
