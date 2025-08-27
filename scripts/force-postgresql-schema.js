const { PrismaClient } = require('@prisma/client');

// This script FORCES the production database to use PostgreSQL schema
// It will completely recreate the database structure to ensure compatibility

const productionPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function forcePostgreSQLSchema() {
  try {
    console.log('🚨 FORCING POSTGRESQL SCHEMA IN PRODUCTION...');
    console.log('📊 This will completely recreate the database structure\n');

    // Test connection
    console.log('🔌 Testing production database connection...');
    try {
      await productionPrisma.$queryRaw`SELECT 1`;
      console.log('✅ Production database connection successful');
    } catch (error) {
      console.error('❌ Production database connection failed:', error.message);
      return;
    }

    console.log('\n🗑️ Step 1: Dropping all existing tables...');
    
    // Drop all tables in reverse dependency order
    const tablesToDrop = [
      'QuoteOperational', 'QuoteAmount', 'Finishing', 'Paper', 'Quote', 
      'Material', 'Supplier', 'Client', 'User', 'SalesPerson', 'UAEArea',
      'SearchHistory', 'SearchAnalytics'
    ];
    
    for (const table of tablesToDrop) {
      try {
        await productionPrisma.$executeRaw`DROP TABLE IF EXISTS "${table}" CASCADE`;
        console.log(`✅ Dropped table: ${table}`);
      } catch (error) {
        console.log(`⚠️ Could not drop ${table}: ${error.message}`);
      }
    }

    console.log('\n📝 Step 2: Creating tables with PostgreSQL schema...');
    
    // Create User table
    console.log('👥 Creating User table...');
    await productionPrisma.$executeRaw`
      CREATE TABLE "User" (
        "id" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "role" TEXT NOT NULL DEFAULT 'user',
        "password" TEXT,
        "profilePicture" TEXT,
        "status" TEXT NOT NULL DEFAULT 'Active',
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "salesPersonId" TEXT,
        "isSalesPerson" BOOLEAN NOT NULL DEFAULT false,
        CONSTRAINT "User_pkey" PRIMARY KEY ("id")
      )
    `;
    await productionPrisma.$executeRaw`CREATE UNIQUE INDEX "User_email_key" ON "User"("email")`;
    console.log('✅ User table created');

    // Create SalesPerson table
    console.log('👤 Creating SalesPerson table...');
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
    await productionPrisma.$executeRaw`CREATE UNIQUE INDEX "SalesPerson_salesPersonId_key" ON "SalesPerson"("salesPersonId")`;
    await productionPrisma.$executeRaw`CREATE UNIQUE INDEX "SalesPerson_email_key" ON "SalesPerson"("email")`;
    console.log('✅ SalesPerson table created');

    // Create UAEArea table
    console.log('🗺️ Creating UAEArea table...');
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

    // Create Supplier table
    console.log('🏭 Creating Supplier table...');
    await productionPrisma.$executeRaw`
      CREATE TABLE "Supplier" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "contact" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "countryCode" TEXT NOT NULL DEFAULT '+971',
        "address" TEXT NOT NULL,
        "city" TEXT NOT NULL,
        "state" TEXT NOT NULL,
        "postalCode" TEXT NOT NULL,
        "country" TEXT NOT NULL DEFAULT 'UAE',
        "status" TEXT NOT NULL DEFAULT 'Active',
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
      )
    `;
    console.log('✅ Supplier table created');

    // Create Material table
    console.log('📦 Creating Material table...');
    await productionPrisma.$executeRaw`
      CREATE TABLE "Material" (
        "id" TEXT NOT NULL,
        "materialId" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "gsm" INTEGER NOT NULL,
        "supplierId" TEXT NOT NULL,
        "cost" REAL NOT NULL,
        "unit" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'Active',
        "lastUpdated" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Material_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Material_materialId_key" UNIQUE ("materialId")
      )
    `;
    console.log('✅ Material table created');

    // Create Client table
    console.log('🏢 Creating Client table...');
    await productionPrisma.$executeRaw`
      CREATE TABLE "Client" (
        "id" TEXT NOT NULL,
        "clientType" TEXT NOT NULL,
        "companyName" TEXT,
        "contactPerson" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "phone" TEXT NOT NULL,
        "countryCode" TEXT NOT NULL,
        "role" TEXT,
        "status" TEXT NOT NULL DEFAULT 'Active',
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "userId" TEXT,
        "address" TEXT,
        "city" TEXT,
        "state" TEXT,
        "postalCode" TEXT,
        "country" TEXT,
        "firstName" TEXT,
        "lastName" TEXT,
        "designation" TEXT,
        "emails" TEXT,
        "trn" TEXT,
        "hasNoTrn" INTEGER DEFAULT 0,
        "area" TEXT,
        CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
      )
    `;
    console.log('✅ Client table created');

    // Create Quote table
    console.log('📄 Creating Quote table...');
    await productionPrisma.$executeRaw`
      CREATE TABLE "Quote" (
        "id" TEXT NOT NULL,
        "quoteId" TEXT NOT NULL,
        "date" TIMESTAMP NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'Pending',
        "clientId" TEXT NOT NULL,
        "userId" TEXT,
        "salesPersonId" TEXT,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "product" TEXT NOT NULL,
        "quantity" INTEGER NOT NULL,
        "sides" TEXT NOT NULL,
        "printing" TEXT NOT NULL,
        "colors" TEXT,
        "productName" TEXT,
        "printingSelection" TEXT,
        "flatSizeHeight" REAL,
        "closeSizeSpine" REAL,
        "useSameAsFlat" BOOLEAN DEFAULT false,
        "flatSizeWidth" REAL,
        "flatSizeSpine" REAL,
        "closeSizeHeight" REAL,
        "closeSizeWidth" REAL,
        "finishingComments" TEXT,
        "approvalStatus" TEXT DEFAULT 'Draft',
        "requiresApproval" BOOLEAN DEFAULT false,
        "approvalReason" TEXT,
        "approvedBy" TEXT,
        "approvedAt" TIMESTAMP,
        "approvalNotes" TEXT,
        "discountPercentage" REAL DEFAULT 0,
        "discountAmount" REAL DEFAULT 0,
        "marginPercentage" REAL DEFAULT 15,
        "marginAmount" REAL DEFAULT 0,
        "customerPdfEnabled" BOOLEAN DEFAULT true,
        "sendToCustomerEnabled" BOOLEAN DEFAULT true,
        CONSTRAINT "Quote_pkey" PRIMARY KEY ("id"),
        CONSTRAINT "Quote_quoteId_key" UNIQUE ("quoteId")
      )
    `;
    console.log('✅ Quote table created');

    // Create Paper table
    console.log('📰 Creating Paper table...');
    await productionPrisma.$executeRaw`
      CREATE TABLE "Paper" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "gsm" INTEGER NOT NULL,
        "quoteId" TEXT NOT NULL,
        "inputWidth" REAL NOT NULL,
        "inputHeight" REAL NOT NULL,
        "pricePerPacket" REAL NOT NULL,
        "pricePerSheet" REAL NOT NULL,
        "sheetsPerPacket" INTEGER NOT NULL,
        "recommendedSheets" INTEGER NOT NULL,
        "enteredSheets" INTEGER NOT NULL,
        "outputWidth" REAL NOT NULL,
        "outputHeight" REAL NOT NULL,
        "selectedColors" TEXT NOT NULL,
        CONSTRAINT "Paper_pkey" PRIMARY KEY ("id")
      )
    `;
    console.log('✅ Paper table created');

    // Create Finishing table
    console.log('✨ Creating Finishing table...');
    await productionPrisma.$executeRaw`
      CREATE TABLE "Finishing" (
        "id" TEXT NOT NULL,
        "name" TEXT NOT NULL,
        "quoteId" TEXT NOT NULL,
        "cost" REAL NOT NULL,
        CONSTRAINT "Finishing_pkey" PRIMARY KEY ("id")
      )
    `;
    console.log('✅ Finishing table created');

    // Create QuoteAmount table
    console.log('💰 Creating QuoteAmount table...');
    await productionPrisma.$executeRaw`
      CREATE TABLE "QuoteAmount" (
        "id" TEXT NOT NULL,
        "base" REAL NOT NULL,
        "vat" REAL NOT NULL,
        "total" REAL NOT NULL,
        "quoteId" TEXT NOT NULL,
        CONSTRAINT "QuoteAmount_pkey" PRIMARY KEY ("id")
      )
    `;
    console.log('✅ QuoteAmount table created');

    // Create QuoteOperational table
    console.log('⚙️ Creating QuoteOperational table...');
    await productionPrisma.$executeRaw`
      CREATE TABLE "QuoteOperational" (
        "id" TEXT NOT NULL,
        "quoteId" TEXT NOT NULL,
        "plates" INTEGER NOT NULL,
        "units" INTEGER NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "QuoteOperational_pkey" PRIMARY KEY ("id")
      )
    `;
    console.log('✅ QuoteOperational table created');

    // Create SearchHistory table
    console.log('🔍 Creating SearchHistory table...');
    await productionPrisma.$executeRaw`
      CREATE TABLE "SearchHistory" (
        "id" TEXT NOT NULL,
        "query" TEXT NOT NULL,
        "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "userId" TEXT NOT NULL,
        CONSTRAINT "SearchHistory_pkey" PRIMARY KEY ("id")
      )
    `;
    console.log('✅ SearchHistory table created');

    // Create SearchAnalytics table
    console.log('📊 Creating SearchAnalytics table...');
    await productionPrisma.$executeRaw`
      CREATE TABLE "SearchAnalytics" (
        "id" TEXT NOT NULL,
        "query" TEXT NOT NULL,
        "timestamp" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "userId" TEXT NOT NULL,
        CONSTRAINT "SearchAnalytics_pkey" PRIMARY KEY ("id")
      )
    `;
    console.log('✅ SearchAnalytics table created');

    console.log('\n🔗 Step 3: Adding foreign key constraints...');
    
    // Add foreign key constraints
    try {
      await productionPrisma.$executeRaw`ALTER TABLE "Material" ADD CONSTRAINT "Material_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id")`;
      await productionPrisma.$executeRaw`ALTER TABLE "Client" ADD CONSTRAINT "Client_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id")`;
      await productionPrisma.$executeRaw`ALTER TABLE "Quote" ADD CONSTRAINT "Quote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id")`;
      await productionPrisma.$executeRaw`ALTER TABLE "Quote" ADD CONSTRAINT "Quote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id")`;
      await productionPrisma.$executeRaw`ALTER TABLE "Quote" ADD CONSTRAINT "Quote_salesPersonId_fkey" FOREIGN KEY ("salesPersonId") REFERENCES "SalesPerson"("salesPersonId")`;
      await productionPrisma.$executeRaw`ALTER TABLE "Paper" ADD CONSTRAINT "Paper_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id")`;
      await productionPrisma.$executeRaw`ALTER TABLE "Finishing" ADD CONSTRAINT "Finishing_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id")`;
      await productionPrisma.$executeRaw`ALTER TABLE "QuoteAmount" ADD CONSTRAINT "QuoteAmount_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id")`;
      await productionPrisma.$executeRaw`ALTER TABLE "QuoteOperational" ADD CONSTRAINT "QuoteOperational_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id")`;
      await productionPrisma.$executeRaw`ALTER TABLE "SearchHistory" ADD CONSTRAINT "SearchHistory_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id")`;
      await productionPrisma.$executeRaw`ALTER TABLE "SearchAnalytics" ADD CONSTRAINT "SearchAnalytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id")`;
      console.log('✅ Foreign key constraints added');
    } catch (error) {
      console.log('⚠️ Some foreign key constraints could not be added:', error.message);
    }

    console.log('\n🎯 Step 4: Final verification...');
    
    // Get updated table list
    const updatedTables = await productionPrisma.$queryRaw`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `;
    
    console.log('\n✅ All tables created successfully:');
    updatedTables.forEach(table => {
      console.log(`   - ${table.table_name}`);
    });

    console.log('\n🎉 POSTGRESQL SCHEMA FORCE COMPLETED!');
    console.log('\n📋 Next steps:');
    console.log('1. Wait for Vercel to redeploy (2-5 minutes)');
    console.log('2. Run the sync script to populate with your local data');
    console.log('3. Verify all data is now accessible');
    console.log('\n⚠️ IMPORTANT: All existing data was dropped and tables recreated!');

  } catch (error) {
    console.error('❌ Force PostgreSQL schema failed:', error);
    console.error('Error details:', error.message);
  } finally {
    await productionPrisma.$disconnect();
  }
}

// Run the force fix
forcePostgreSQLSchema();
