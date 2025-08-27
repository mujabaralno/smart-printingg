const { PrismaClient } = require('@prisma/client');

// This script will deploy the updated schema and data to Vercel production
const prisma = new PrismaClient();

async function deployToProduction() {
  try {
    console.log('🚀 Deploying Smart Printing System to Vercel Production...');
    
    // Test connection
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Production database connection successful');
    
    console.log('\n📋 Current database schema check...');
    
    // Check if SalesPerson table exists, if not create it
    try {
      await prisma.$queryRaw`SELECT * FROM "SalesPerson" LIMIT 1`;
      console.log('✅ SalesPerson table already exists');
    } catch (error) {
      console.log('📝 Creating SalesPerson table...');
      await prisma.$executeRaw`
        CREATE TABLE "SalesPerson" (
          "id" TEXT NOT NULL,
          "salesPersonId" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "email" TEXT NOT NULL,
          "phone" TEXT NOT NULL,
          "countryCode" TEXT NOT NULL DEFAULT '+971',
          "designation" TEXT NOT NULL DEFAULT 'Sales Representative',
          "department" TEXT NOT NULL DEFAULT 'Sales',
          "hireDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "status" TEXT NOT NULL DEFAULT 'Active',
          "profilePicture" TEXT,
          "address" TEXT,
          "city" TEXT NOT NULL DEFAULT 'Dubai',
          "state" TEXT NOT NULL DEFAULT 'Dubai',
          "postalCode" TEXT,
          "country" TEXT NOT NULL DEFAULT 'UAE',
          "notes" TEXT,
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL,
          CONSTRAINT "SalesPerson_pkey" PRIMARY KEY ("id")
        )
      `;
      
      // Create unique index on salesPersonId
      await prisma.$executeRaw`CREATE UNIQUE INDEX "SalesPerson_salesPersonId_key" ON "SalesPerson"("salesPersonId")`;
      
      // Create unique index on email
      await prisma.$executeRaw`CREATE UNIQUE INDEX "SalesPerson_email_key" ON "SalesPerson"("email")`;
      
      console.log('✅ SalesPerson table created successfully');
    }
    
    // Check if UAEArea table exists, if not create it
    try {
      await prisma.$queryRaw`SELECT * FROM "UAEArea" LIMIT 1`;
      console.log('✅ UAEArea table already exists');
    } catch (error) {
      console.log('📝 Creating UAEArea table...');
      await prisma.$executeRaw`
        CREATE TABLE "UAEArea" (
          "id" TEXT NOT NULL,
          "name" TEXT NOT NULL,
          "state" TEXT NOT NULL,
          "country" TEXT NOT NULL DEFAULT 'UAE',
          "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" DATETIME NOT NULL,
          CONSTRAINT "UAEArea_pkey" PRIMARY KEY ("id")
        )
      `;
      console.log('✅ UAEArea table created successfully');
    }
    
    // Add new columns to User table if they don't exist
    try {
      await prisma.$queryRaw`SELECT "salesPersonId" FROM "User" LIMIT 1`;
      console.log('✅ User table already has salesPersonId column');
    } catch (error) {
      console.log('📝 Adding salesPersonId and isSalesPerson columns to User table...');
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN "salesPersonId" TEXT`;
      await prisma.$executeRaw`ALTER TABLE "User" ADD COLUMN "isSalesPerson" BOOLEAN DEFAULT false`;
      await prisma.$executeRaw`CREATE UNIQUE INDEX "User_salesPersonId_key" ON "User"("salesPersonId")`;
      console.log('✅ New columns added to User table');
    }
    
    // Add new columns to Client table if they don't exist
    const clientColumns = [
      'firstName', 'lastName', 'designation', 'emails', 'trn', 'hasNoTrn', 'area'
    ];
    
    for (const column of clientColumns) {
      try {
        await prisma.$queryRaw`SELECT "${column}" FROM "Client" LIMIT 1`;
        console.log(`✅ Client table already has ${column} column`);
      } catch (error) {
        console.log(`📝 Adding ${column} column to Client table...`);
        if (column === 'hasNoTrn') {
          await prisma.$executeRaw`ALTER TABLE "Client" ADD COLUMN "${column}" INTEGER DEFAULT 0`;
        } else {
          await prisma.$executeRaw`ALTER TABLE "Client" ADD COLUMN "${column}" TEXT`;
        }
        console.log(`✅ ${column} column added to Client table`);
      }
    }
    
    // Add new columns to Quote table if they don't exist
    const quoteColumns = [
      'salesPersonId', 'finishingComments', 'approvalStatus', 'requiresApproval',
      'approvalReason', 'approvedBy', 'approvedAt', 'approvalNotes',
      'discountPercentage', 'discountAmount', 'marginPercentage', 'marginAmount',
      'customerPdfEnabled', 'sendToCustomerEnabled'
    ];
    
    for (const column of quoteColumns) {
      try {
        await prisma.$queryRaw`SELECT "${column}" FROM "Quote" LIMIT 1`;
        console.log(`✅ Quote table already has ${column} column`);
      } catch (error) {
        console.log(`📝 Adding ${column} column to Quote table...`);
        if (column === 'requiresApproval' || column === 'customerPdfEnabled' || column === 'sendToCustomerEnabled') {
          await prisma.$executeRaw`ALTER TABLE "Quote" ADD COLUMN "${column}" BOOLEAN DEFAULT false`;
        } else if (column === 'discountPercentage' || column === 'marginPercentage') {
          await prisma.$executeRaw`ALTER TABLE "Quote" ADD COLUMN "${column}" REAL DEFAULT 0`;
        } else if (column === 'discountAmount' || column === 'marginAmount') {
          await prisma.$executeRaw`ALTER TABLE "Quote" ADD COLUMN "${column}" REAL DEFAULT 0`;
        } else if (column === 'approvedAt') {
          await prisma.$executeRaw`ALTER TABLE "Quote" ADD COLUMN "${column}" DATETIME`;
        } else {
          await prisma.$executeRaw`ALTER TABLE "Quote" ADD COLUMN "${column}" TEXT`;
        }
        console.log(`✅ ${column} column added to Quote table`);
      }
    }
    
    // Create sample sales persons
    console.log('\n👥 Creating sample sales persons...');
    const salesPersons = [
      {
        salesPersonId: 'EMP001',
        name: 'Ahmed Al-Rashid',
        email: 'ahmed.rashid@smartprinting.ae',
        phone: '501234567',
        countryCode: '+971',
        designation: 'Senior Sales Representative',
        department: 'Sales',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE'
      },
      {
        salesPersonId: 'EMP002',
        name: 'Fatima Al-Zahra',
        email: 'fatima.zahra@smartprinting.ae',
        phone: '559876543',
        countryCode: '+971',
        designation: 'Sales Representative',
        department: 'Sales',
        city: 'Abu Dhabi',
        state: 'Abu Dhabi',
        country: 'UAE'
      }
    ];
    
    for (const spData of salesPersons) {
      await prisma.salesPerson.upsert({
        where: { salesPersonId: spData.salesPersonId },
        update: spData,
        create: spData
      });
      console.log(`✅ Sales person created: ${spData.name} (${spData.salesPersonId})`);
    }
    
    // Create admin user (same as your local database)
    console.log('\n👤 Creating admin user...');
    const adminUser = await prisma.user.upsert({
      where: { email: 'admin@example.com' },
      update: {
        name: 'John Admin',
        role: 'admin',
        password: 'admin123',
        status: 'Active'
      },
      create: {
        email: 'admin@example.com',
        name: 'John Admin',
        role: 'admin',
        password: 'admin123',
        status: 'Active'
      }
    });
    console.log(`✅ Admin user created: ${adminUser.email}`);
    
    // Create additional users
    console.log('\n👥 Creating additional users...');
    const users = [
      {
        email: 'estimator@example.com',
        name: 'Jane Estimator',
        role: 'estimator',
        password: 'estimator123'
      },
      {
        email: 'user@example.com',
        name: 'Bob User',
        role: 'user',
        password: 'user123'
      }
    ];
    
    for (const userData of users) {
      await prisma.user.upsert({
        where: { email: userData.email },
        update: userData,
        create: userData
      });
      console.log(`✅ User created: ${userData.email}`);
    }
    
    // Create sample clients
    console.log('\n🏢 Creating sample clients...');
    const clients = [
      {
        clientType: 'Company',
        companyName: 'Eagan Inc.',
        contactPerson: 'John Smith',
        email: 'john.smith@eagan.com',
        phone: '501234567',
        countryCode: '+971',
        role: 'Marketing Manager',
        address: 'Sheikh Zayed Road',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        area: 'Downtown Dubai'
      },
      {
        clientType: 'Company',
        companyName: 'Tech Solutions Ltd.',
        contactPerson: 'Sarah Johnson',
        email: 'sarah.j@techsolutions.com',
        phone: '559876543',
        countryCode: '+971',
        role: 'Operations Director',
        address: 'Al Wasl Road',
        city: 'Dubai',
        state: 'Dubai',
        country: 'UAE',
        area: 'Jumeirah'
      }
    ];
    
    for (const clientData of clients) {
      await prisma.client.upsert({
        where: { email: clientData.email },
        update: clientData,
        create: clientData
      });
      console.log(`✅ Client created: ${clientData.companyName || clientData.contactPerson}`);
    }
    
    // Create sample suppliers
    console.log('\n🏭 Creating sample suppliers...');
    const suppliers = [
      {
        name: 'Paper Source UAE',
        contact: 'Ahmed Hassan',
        email: 'ahmed@papersource.ae',
        phone: '501234567',
        countryCode: '+971',
        address: 'Al Khaleej Street',
        city: 'Dubai',
        state: 'Dubai',
        postalCode: '12345',
        country: 'UAE',
        status: 'Active'
      },
      {
        name: 'Print Materials Co.',
        contact: 'Fatima Al-Rashid',
        email: 'fatima@printmaterials.ae',
        phone: '559876543',
        countryCode: '+971',
        address: 'Al Wasl Road',
        city: 'Dubai',
        state: 'Dubai',
        postalCode: '54321',
        country: 'UAE',
        status: 'Active'
      }
    ];
    
    for (const supplierData of suppliers) {
      await prisma.supplier.upsert({
        where: { email: supplierData.email },
        update: supplierData,
        create: supplierData
      });
      console.log(`✅ Supplier created: ${supplierData.name}`);
    }
    
    // Create sample materials
    console.log('\n📦 Creating sample materials...');
    const materials = [
      {
        materialId: 'M-001',
        name: 'Art Paper 300gsm',
        gsm: '300',
        supplierId: (await prisma.supplier.findFirst({ where: { email: 'ahmed@papersource.ae' } })).id,
        cost: 2.50,
        unit: 'per_sheet',
        status: 'Active'
      },
      {
        materialId: 'M-002',
        name: 'Glossy Paper 250gsm',
        gsm: '250',
        supplierId: (await prisma.supplier.findFirst({ where: { email: 'ahmed@papersource.ae' } })).id,
        cost: 3.20,
        unit: 'per_sheet',
        status: 'Active'
      }
    ];
    
    for (const materialData of materials) {
      await prisma.material.upsert({
        where: { materialId: materialData.materialId },
        update: materialData,
        create: materialData
      });
      console.log(`✅ Material created: ${materialData.name}`);
    }
    
    // Populate UAE areas
    console.log('\n🗺️ Populating UAE areas...');
    const uaeAreas = [
      { name: 'Downtown Dubai', state: 'Dubai' },
      { name: 'Jumeirah', state: 'Dubai' },
      { name: 'Marina', state: 'Dubai' },
      { name: 'Palm Jumeirah', state: 'Dubai' },
      { name: 'Abu Dhabi City', state: 'Abu Dhabi' },
      { name: 'Al Ain', state: 'Abu Dhabi' },
      { name: 'Sharjah City', state: 'Sharjah' },
      { name: 'Ajman City', state: 'Ajman' }
    ];
    
    for (const areaData of uaeAreas) {
      await prisma.uAEArea.upsert({
        where: { 
          name_state: {
            name: areaData.name,
            state: areaData.state
          }
        },
        update: areaData,
        create: areaData
      });
      console.log(`✅ UAE area created: ${areaData.name}, ${areaData.state}`);
    }
    
    console.log('\n🎉 Production deployment completed successfully!');
    console.log('\n📊 Deployment Summary:');
    console.log('   - Database schema updated with all new features');
    console.log('   - SalesPerson table created');
    console.log('   - UAEArea table created');
    console.log('   - New columns added to existing tables');
    console.log('   - Sample data populated');
    console.log('   - Users: 3 (admin, estimator, user)');
    console.log('   - Sales Persons: 2 (EMP001, EMP002)');
    console.log('   - Clients: 2 sample companies');
    console.log('   - Suppliers: 2 (paper and print materials)');
    console.log('   - Materials: 2 (different paper types)');
    console.log('   - UAE Areas: 8 major areas');
    
    console.log('\n🔑 Login Credentials:');
    console.log('   - Admin: admin@example.com / admin123');
    console.log('   - Estimator: estimator@example.com / estimator123');
    console.log('   - User: user@example.com / user123');
    
    console.log('\n✅ Your Smart Printing System is now live on Vercel!');
    
  } catch (error) {
    console.error('❌ Production deployment failed:', error);
    console.error('Error details:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

deployToProduction();
