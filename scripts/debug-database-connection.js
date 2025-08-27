const { PrismaClient } = require('@prisma/client');

// This script debugs the database connection and identifies the exact issue

const productionPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function debugDatabaseConnection() {
  try {
    console.log('🔍 DEBUGGING DATABASE CONNECTION...');
    console.log('📊 This will identify the exact issue\n');

    // Check environment variables
    console.log('🔧 Environment Variables:');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);
    if (process.env.DATABASE_URL) {
      console.log(`   DATABASE_URL Prefix: ${process.env.DATABASE_URL.substring(0, 20)}...`);
    }

    // Test basic connection
    console.log('\n🔌 Testing basic database connection...');
    try {
      const result = await productionPrisma.$queryRaw`SELECT 1 as test`;
      console.log('✅ Basic connection successful:', result);
    } catch (error) {
      console.error('❌ Basic connection failed:', error.message);
      return;
    }

    // Check database info
    console.log('\n📊 Checking database information...');
    try {
      const dbInfo = await productionPrisma.$queryRaw`
        SELECT 
          current_database() as database_name,
          current_user as current_user,
          version() as postgres_version
      `;
      console.log('✅ Database info:', dbInfo[0]);
    } catch (error) {
      console.error('❌ Could not get database info:', error.message);
    }

    // Check current tables
    console.log('\n📋 Checking current table structure...');
    try {
      const tables = await productionPrisma.$queryRaw`
        SELECT 
          table_name,
          table_type,
          table_schema
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `;
      
      console.log('Current tables in production:');
      tables.forEach(table => {
        console.log(`   - ${table.table_name} (${table.table_type})`);
      });
    } catch (error) {
      console.error('❌ Could not get table structure:', error.message);
    }

    // Check if SalesPerson table exists
    console.log('\n👤 Checking SalesPerson table...');
    try {
      const salesPersonCheck = await productionPrisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'SalesPerson'
        ) as exists
      `;
      console.log(`SalesPerson table exists: ${salesPersonCheck[0]?.exists}`);
      
      if (salesPersonCheck[0]?.exists) {
        const salesPersonCount = await productionPrisma.$queryRaw`SELECT COUNT(*) as count FROM "SalesPerson"`;
        console.log(`SalesPerson count: ${salesPersonCount[0]?.count}`);
      }
    } catch (error) {
      console.error('❌ Error checking SalesPerson table:', error.message);
    }

    // Check if UAEArea table exists
    console.log('\n🗺️ Checking UAEArea table...');
    try {
      const uaeAreaCheck = await productionPrisma.$queryRaw`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'UAEArea'
        ) as exists
      `;
      console.log(`UAEArea table exists: ${uaeAreaCheck[0]?.exists}`);
      
      if (uaeAreaCheck[0]?.exists) {
        const uaeAreaCount = await productionPrisma.$queryRaw`SELECT COUNT(*) as count FROM "UAEArea"`;
        console.log(`UAEArea count: ${uaeAreaCount[0]?.count}`);
      }
    } catch (error) {
      console.error('❌ Error checking UAEArea table:', error.message);
    }

    // Check User table structure
    console.log('\n👥 Checking User table structure...');
    try {
      const userColumns = await productionPrisma.$queryRaw`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'User' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `;
      
      console.log('User table columns:');
      userColumns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } catch (error) {
      console.error('❌ Error checking User table structure:', error.message);
    }

    // Check Quote table structure
    console.log('\n📄 Checking Quote table structure...');
    try {
      const quoteColumns = await productionPrisma.$queryRaw`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'Quote' 
        AND table_schema = 'public'
        ORDER BY ordinal_position
      `;
      
      console.log('Quote table columns:');
      quoteColumns.forEach(col => {
        console.log(`   - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
    } catch (error) {
      console.error('❌ Error checking Quote table structure:', error.message);
    }

    // Test data access
    console.log('\n📊 Testing data access...');
    try {
      const userCount = await productionPrisma.$queryRaw`SELECT COUNT(*) as count FROM "User"`;
      console.log(`✅ User count: ${userCount[0]?.count}`);
      
      const clientCount = await productionPrisma.$queryRaw`SELECT COUNT(*) as count FROM "Client"`;
      console.log(`✅ Client count: ${clientCount[0]?.count}`);
      
      const quoteCount = await productionPrisma.$queryRaw`SELECT COUNT(*) as count FROM "Quote"`;
      console.log(`✅ Quote count: ${quoteCount[0]?.count}`);
    } catch (error) {
      console.error('❌ Error testing data access:', error.message);
    }

    // Check Prisma client info
    console.log('\n🔧 Prisma Client Information:');
    console.log(`   Prisma Client Version: ${productionPrisma._clientVersion}`);
    console.log(`   Connection URL: ${productionPrisma._engineConfig?.datasources?.db?.url ? 'CONFIGURED' : 'NOT CONFIGURED'}`);

    console.log('\n🎯 Debug Summary:');
    console.log('✅ If all tests pass, the database connection is working');
    console.log('❌ If any tests fail, we know exactly what to fix');
    console.log('\n📋 Next steps will depend on what we find');

  } catch (error) {
    console.error('❌ Debug script failed:', error);
    console.error('Error details:', error.message);
  } finally {
    await productionPrisma.$disconnect();
  }
}

// Run the debug
debugDatabaseConnection();
