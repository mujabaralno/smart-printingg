const { PrismaClient } = require('@prisma/client');

const productionPrisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
});

async function addSampleData() {
  try {
    console.log('👥 Adding sample sales person data...');
    
    // Check if sales person data already exists
    const existingSalesPerson = await productionPrisma.$queryRaw`SELECT COUNT(*) as count FROM "SalesPerson"`;
    console.log(`Current sales person count: ${existingSalesPerson[0]?.count}`);
    
    if (existingSalesPerson[0]?.count === 0) {
      // Add sample sales person data
      await productionPrisma.$executeRaw`INSERT INTO "SalesPerson" (id, "salesPersonId", name, email, phone, "countryCode", designation, department, "hireDate", status, city, state, country, "createdAt", "updatedAt") VALUES ('sp_001', 'SL-001', 'Ahmed Al Mansouri', 'ahmed.mansouri@smartprinting.ae', '0501234567', '+971', 'Senior Sales Manager', 'Sales', CURRENT_TIMESTAMP, 'Active', 'Dubai', 'Dubai', 'UAE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
      
      await productionPrisma.$executeRaw`INSERT INTO "SalesPerson" (id, "salesPersonId", name, email, phone, "countryCode", designation, department, "hireDate", status, city, state, country, "createdAt", "updatedAt") VALUES ('sp_002', 'SL-002', 'Fatima Al Zahra', 'fatima.zahra@smartprinting.ae', '0502345678', '+971', 'Sales Representative', 'Sales', CURRENT_TIMESTAMP, 'Active', 'Abu Dhabi', 'Abu Dhabi', 'UAE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
      
      await productionPrisma.$executeRaw`INSERT INTO "SalesPerson" (id, "salesPersonId", name, email, phone, "countryCode", designation, department, "hireDate", status, city, state, country, "createdAt", "updatedAt") VALUES ('sp_003', 'SL-003', 'Omar Al Rashid', 'omar.rashid@smartprinting.ae', '0503456789', '+971', 'Sales Executive', 'Sales', CURRENT_TIMESTAMP, 'Active', 'Sharjah', 'Sharjah', 'UAE', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`;
      
      console.log('✅ Sample sales person data added successfully');
    } else {
      console.log('✅ Sales person data already exists');
    }
    
    // Verify the data
    const finalCount = await productionPrisma.$queryRaw`SELECT COUNT(*) as count FROM "SalesPerson"`;
    console.log(`Final sales person count: ${finalCount[0]?.count}`);
    
    if (finalCount[0]?.count > 0) {
      const sampleData = await productionPrisma.$queryRaw`SELECT "salesPersonId", name, email FROM "SalesPerson" LIMIT 3`;
      console.log('✅ Sample data:');
      sampleData.forEach((sp, index) => {
        console.log(`   ${index + 1}. ${sp.salesPersonId} - ${sp.name} (${sp.email})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Error adding sample data:', error);
  } finally {
    await productionPrisma.$disconnect();
  }
}

addSampleData();
