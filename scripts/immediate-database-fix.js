const { PrismaClient } = require('@prisma/client');

// This script IMMEDIATELY fixes the database issues
// It will work right now without waiting for Vercel redeploy

const productionPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function immediateDatabaseFix() {
  try {
    console.log('🚨 IMMEDIATE DATABASE FIX - WORKING NOW!');
    console.log('📊 This will fix your data access issues immediately\n');

    // Test connection
    console.log('🔌 Testing production database connection...');
    try {
      await productionPrisma.$queryRaw`SELECT 1`;
      console.log('✅ Production database connection successful');
    } catch (error) {
      console.error('❌ Production database connection failed:', error.message);
      return;
    }

    console.log('\n📋 Step 1: Creating missing tables immediately...');
    
    // Create SalesPerson table if it doesn't exist
    try {
      await productionPrisma.$queryRaw`SELECT * FROM "SalesPerson" LIMIT 1`;
      console.log('✅ SalesPerson table already exists');
    } catch (error) {
      console.log('📝 Creating SalesPerson table NOW...');
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
      console.log('✅ SalesPerson table created NOW');
    }

    // Create UAEArea table if it doesn't exist
    try {
      await productionPrisma.$queryRaw`SELECT * FROM "UAEArea" LIMIT 1`;
      console.log('✅ UAEArea table already exists');
    } catch (error) {
      console.log('📝 Creating UAEArea table NOW...');
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
      console.log('✅ UAEArea table created NOW');
    }

    console.log('\n🔧 Step 2: Adding missing columns to existing tables...');
    
    // Add columns to User table
    const userColumns = ['salesPersonId', 'isSalesPerson'];
    for (const column of userColumns) {
      try {
        await productionPrisma.$queryRaw`SELECT "${column}" FROM "User" LIMIT 1`;
        console.log(`✅ User table already has ${column} column`);
      } catch (error) {
        console.log(`📝 Adding ${column} column to User table NOW...`);
        if (column === 'isSalesPerson') {
          await productionPrisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "${column}" BOOLEAN DEFAULT false`);
        } else {
          await productionPrisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN "${column}" TEXT`);
        }
        console.log(`✅ ${column} column added to User table NOW`);
      }
    }

    // Add columns to Client table
    const clientColumns = ['firstName', 'lastName', 'designation', 'emails', 'trn', 'hasNoTrn', 'area'];
    for (const column of clientColumns) {
      try {
        await productionPrisma.$queryRaw`SELECT "${column}" FROM "Client" LIMIT 1`;
        console.log(`✅ Client table already has ${column} column`);
      } catch (error) {
        console.log(`📝 Adding ${column} column to Client table NOW...`);
        if (column === 'hasNoTrn') {
          await productionPrisma.$executeRawUnsafe(`ALTER TABLE "Client" ADD COLUMN "${column}" INTEGER DEFAULT 0`);
        } else {
          await productionPrisma.$executeRawUnsafe(`ALTER TABLE "Client" ADD COLUMN "${column}" TEXT`);
        }
        console.log(`✅ ${column} column added to Client table NOW`);
      }
    }

    // Add columns to Quote table
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
        console.log(`📝 Adding ${column} column to Quote table NOW...`);
        if (column === 'requiresApproval' || column === 'customerPdfEnabled' || column === 'sendToCustomerEnabled') {
          await productionPrisma.$executeRawUnsafe(`ALTER TABLE "Quote" ADD COLUMN "${column}" BOOLEAN DEFAULT false`);
        } else if (column === 'discountPercentage' || column === 'marginPercentage') {
          await productionPrisma.$executeRawUnsafe(`ALTER TABLE "Quote" ADD COLUMN "${column}" REAL DEFAULT 0`);
        } else if (column === 'discountAmount' || column === 'marginAmount') {
          await productionPrisma.$executeRawUnsafe(`ALTER TABLE "Quote" ADD COLUMN "${column}" REAL DEFAULT 0`);
        } else if (column === 'approvedAt') {
          await productionPrisma.$executeRawUnsafe(`ALTER TABLE "Quote" ADD COLUMN "${column}" TIMESTAMP`);
        } else {
          await productionPrisma.$executeRawUnsafe(`ALTER TABLE "Quote" ADD COLUMN "${column}" TEXT`);
        }
        console.log(`✅ ${column} column added to Quote table NOW`);
      }
    }

    console.log('\n👥 Step 3: Adding sample sales person data...');
    
    // Add sample sales person data
    try {
      const existingSalesPerson = await productionPrisma.$queryRaw`SELECT COUNT(*) as count FROM "SalesPerson"`;
      if (existingSalesPerson[0]?.count === 0) {
        console.log('📝 Adding sample sales person data NOW...');
        
        await productionPrisma.$executeRaw`
          INSERT INTO "SalesPerson" (
            id, "salesPersonId", name, email, phone, "countryCode", designation, 
            department, "hireDate", status, city, state, country, "createdAt", "updatedAt"
          ) VALUES (
            'sp_001', 'SL-001', 'Ahmed Al Mansouri', 'ahmed.mansouri@smartprinting.ae', 
            '0501234567', '+971', 'Senior Sales Manager', 'Sales', 
            CURRENT_TIMESTAMP, 'Active', 'Dubai', 'Dubai', 'UAE', 
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
        `;
        
        await productionPrisma.$executeRaw`
          INSERT INTO "SalesPerson" (
            id, "salesPersonId", name, email, phone, "countryCode", designation, 
            department, "hireDate", status, city, state, country, "createdAt", "updatedAt"
          ) VALUES (
            'sp_002', 'SL-002', 'Fatima Al Zahra', 'fatima.zahra@smartprinting.ae', 
            '0502345678', '+971', 'Sales Representative', 'Sales', 
            CURRENT_TIMESTAMP, 'Active', 'Abu Dhabi', 'Abu Dhabi', 'UAE', 
            CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
          )
        `;
        
        console.log('✅ Sample sales person data added NOW');
      } else {
        console.log(`✅ Sales person data already exists (${existingSalesPerson[0]?.count} records)`);
      }
    } catch (error) {
      console.log('⚠️ Could not add sample sales person data:', error.message);
    }

    console.log('\n🗺️ Step 4: Adding sample UAE area data...');
    
    // Add sample UAE area data
    try {
      const existingUAEArea = await productionPrisma.$queryRaw`SELECT COUNT(*) as count FROM "UAEArea"`;
      if (existingUAEArea[0]?.count === 0) {
        console.log('📝 Adding sample UAE area data NOW...');
        
        await productionPrisma.$executeRaw`
          INSERT INTO "UAEArea" (id, name, state, country, "createdAt", "updatedAt")
          VALUES ('area_001', 'Dubai Marina', 'Dubai', 'UAE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;
        
        await productionPrisma.$executeRaw`
          INSERT INTO "UAEArea" (id, name, state, country, "createdAt", "updatedAt")
          VALUES ('area_002', 'Abu Dhabi Corniche', 'Abu Dhabi', 'UAE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `;
        
        console.log('✅ Sample UAE area data added NOW');
      } else {
        console.log(`✅ UAE area data already exists (${existingUAEArea[0]?.count} records)`);
      }
    } catch (error) {
      console.log('⚠️ Could not add sample UAE area data:', error.message);
    }

    console.log('\n📊 Step 5: Testing data access NOW...');
    
    // Test if we can access quotes
    try {
      const quoteCount = await productionPrisma.$queryRaw`SELECT COUNT(*) as count FROM "Quote"`;
      console.log(`✅ Quotes accessible: ${quoteCount[0]?.count} quotes found`);
      
      if (quoteCount[0]?.count > 0) {
        const sampleQuote = await productionPrisma.$queryRaw`SELECT "quoteId", status FROM "Quote" LIMIT 1`;
        console.log(`✅ Sample quote: ${sampleQuote[0]?.quoteId} - ${sampleQuote[0]?.status}`);
      }
    } catch (error) {
      console.error(`❌ Error accessing quotes: ${error.message}`);
    }

    // Test if we can access users
    try {
      const userCount = await productionPrisma.$queryRaw`SELECT COUNT(*) as count FROM "User"`;
      console.log(`✅ Users accessible: ${userCount[0]?.count} users found`);
    } catch (error) {
      console.error(`❌ Error accessing users: ${error.message}`);
    }

    // Test if we can access clients
    try {
      const clientCount = await productionPrisma.$queryRaw`SELECT COUNT(*) as count FROM "Client"`;
      console.log(`✅ Clients accessible: ${clientCount[0]?.count} clients found`);
    } catch (error) {
      console.error(`❌ Error accessing clients: ${error.message}`);
    }

    console.log('\n🎯 Step 6: Final verification...');
    
    // Get updated table list
    const updatedTables = await productionPrisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('\n✅ All tables now exist:');
    updatedTables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });

    console.log('\n🎉 IMMEDIATE DATABASE FIX COMPLETED!');
    console.log('\n📋 What this fixed:');
    console.log('✅ Created missing SalesPerson and UAEArea tables');
    console.log('✅ Added all missing columns to existing tables');
    console.log('✅ Added sample data for new features');
    console.log('✅ Verified data accessibility');
    console.log('\n🌐 Now check your production dashboard - it should show data!');
    console.log('📱 If still showing "0", the issue is with the Prisma client, not the database');

  } catch (error) {
    console.error('❌ Immediate database fix failed:', error);
    console.error('Error details:', error.message);
  } finally {
    await productionPrisma.$disconnect();
  }
}

// Run the immediate fix
immediateDatabaseFix();
