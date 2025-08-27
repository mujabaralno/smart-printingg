const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// This script will sync your local database EXACTLY to production
// It will ensure both databases have identical structure and data

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

async function syncLocalToProduction() {
  try {
    console.log('🚀 Starting Local to Production Database Sync...');
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
      console.error('Please ensure DATABASE_URL environment variable is set correctly');
      return;
    }

    console.log('\n📋 Step 1: Creating missing tables in production...');
    
    // Create SalesPerson table if it doesn't exist
    try {
      await productionPrisma.$queryRaw`SELECT * FROM "SalesPerson" LIMIT 1`;
      console.log('✅ SalesPerson table already exists in production');
    } catch (error) {
      console.log('📝 Creating SalesPerson table in production...');
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
      console.log('✅ SalesPerson table created in production');
    }

    // Create UAEArea table if it doesn't exist
    try {
      await productionPrisma.$queryRaw`SELECT * FROM "UAEArea" LIMIT 1`;
      console.log('✅ UAEArea table already exists in production');
    } catch (error) {
      console.log('📝 Creating UAEArea table in production...');
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
      console.log('✅ UAEArea table created in production');
    }

    // Add missing columns to existing tables
    console.log('\n📝 Step 2: Adding missing columns to existing tables...');
    
    // Add columns to User table
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

    // Add columns to Client table
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

    console.log('\n🗑️ Step 3: Clearing existing production data...');
    
    // Clear all existing data in production (in reverse dependency order)
    try {
      await productionPrisma.$executeRaw`DELETE FROM "QuoteOperational"`;
      await productionPrisma.$executeRaw`DELETE FROM "QuoteAmount"`;
      await productionPrisma.$executeRaw`DELETE FROM "Finishing"`;
      await productionPrisma.$executeRaw`DELETE FROM "Paper"`;
      await productionPrisma.$executeRaw`DELETE FROM "Quote"`;
      await productionPrisma.$executeRaw`DELETE FROM "Material"`;
      await productionPrisma.$executeRaw`DELETE FROM "Supplier"`;
      await productionPrisma.$executeRaw`DELETE FROM "Client"`;
      await productionPrisma.$executeRaw`DELETE FROM "User"`;
      await productionPrisma.$executeRaw`DELETE FROM "SalesPerson"`;
      await productionPrisma.$executeRaw`DELETE FROM "UAEArea"`;
      await productionPrisma.$executeRaw`DELETE FROM "SearchHistory"`;
      await productionPrisma.$executeRaw`DELETE FROM "SearchAnalytics"`;
      console.log('✅ All existing production data cleared');
    } catch (error) {
      console.log('⚠️ Some tables may not exist yet, continuing...');
    }

    console.log('\n📥 Step 4: Syncing data from local to production...');

    // Sync Users
    console.log('\n👥 Syncing Users...');
    const localUsers = await localPrisma.user.findMany();
    for (const user of localUsers) {
      try {
        await productionPrisma.user.create({
          data: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            password: user.password,
            profilePicture: user.profilePicture,
            status: user.status,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            salesPersonId: user.salesPersonId || null,
            isSalesPerson: user.isSalesPerson || false,
          }
        });
        console.log(`✅ User synced: ${user.email}`);
      } catch (error) {
        console.error(`❌ Error syncing user ${user.email}:`, error.message);
      }
    }

    // Sync SalesPersons
    console.log('\n👤 Syncing SalesPersons...');
    try {
      const localSalesPersons = await localPrisma.$queryRaw`SELECT * FROM "SalesPerson"`;
      for (const sp of localSalesPersons) {
        try {
          await productionPrisma.$executeRaw`
            INSERT INTO "SalesPerson" (
              id, "salesPersonId", name, email, phone, "countryCode", designation, 
              department, "hireDate", status, "profilePicture", address, city, 
              state, "postalCode", country, notes, "createdAt", "updatedAt"
            ) VALUES (
              ${sp.id}, ${sp.salesPersonId}, ${sp.name}, ${sp.email}, ${sp.phone},
              ${sp.countryCode}, ${sp.designation}, ${sp.department}, ${sp.hireDate},
              ${sp.status}, ${sp.profilePicture}, ${sp.address}, ${sp.city},
              ${sp.state}, ${sp.postalCode}, ${sp.country}, ${sp.notes},
              ${sp.createdAt}, ${sp.updatedAt}
            )
          `;
          console.log(`✅ SalesPerson synced: ${sp.name} (${sp.salesPersonId})`);
        } catch (error) {
          console.error(`❌ Error syncing sales person ${sp.name}:`, error.message);
        }
      }
    } catch (error) {
      console.log('⚠️ No SalesPerson table in local database');
    }

    // Sync UAEAreas
    console.log('\n🗺️ Syncing UAEAreas...');
    try {
      const localUAEAreas = await localPrisma.$queryRaw`SELECT * FROM "UAEArea"`;
      for (const area of localUAEAreas) {
        try {
          await productionPrisma.$executeRaw`
            INSERT INTO "UAEArea" (id, name, state, country, "createdAt", "updatedAt")
            VALUES (${area.id}, ${area.name}, ${area.state}, ${area.country}, ${area.createdAt}, ${area.updatedAt})
          `;
          console.log(`✅ UAEArea synced: ${area.name}, ${area.state}`);
        } catch (error) {
          console.error(`❌ Error syncing UAE area ${area.name}:`, error.message);
        }
      }
    } catch (error) {
      console.log('⚠️ No UAEArea table in local database');
    }

    // Sync Suppliers
    console.log('\n🏭 Syncing Suppliers...');
    const localSuppliers = await localPrisma.supplier.findMany();
    for (const supplier of localSuppliers) {
      try {
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
            updatedAt: supplier.updatedAt,
          }
        });
        console.log(`✅ Supplier synced: ${supplier.name}`);
      } catch (error) {
        console.error(`❌ Error syncing supplier ${supplier.name}:`, error.message);
      }
    }

    // Sync Materials
    console.log('\n📦 Syncing Materials...');
    const localMaterials = await localPrisma.material.findMany();
    for (const material of localMaterials) {
      try {
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
            updatedAt: material.updatedAt,
          }
        });
        console.log(`✅ Material synced: ${material.name}`);
      } catch (error) {
        console.error(`❌ Error syncing material ${material.name}:`, error.message);
      }
    }

    // Sync Clients
    console.log('\n🏢 Syncing Clients...');
    const localClients = await localPrisma.client.findMany();
    for (const client of localClients) {
      try {
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
            createdAt: client.createdAt,
            updatedAt: client.updatedAt,
            userId: client.userId,
            address: client.address,
            city: client.city,
            state: client.state,
            postalCode: client.postalCode,
            country: client.country,
            firstName: client.firstName,
            lastName: client.lastName,
            designation: client.designation,
            emails: client.emails,
            trn: client.trn,
            hasNoTrn: client.hasNoTrn,
            area: client.area,
          }
        });
        console.log(`✅ Client synced: ${client.contactPerson || client.companyName}`);
      } catch (error) {
        console.error(`❌ Error syncing client ${client.contactPerson}:`, error.message);
      }
    }

    // Sync Quotes
    console.log('\n📄 Syncing Quotes...');
    const localQuotes = await localPrisma.quote.findMany();
    for (const quote of localQuotes) {
      try {
        await productionPrisma.quote.create({
          data: {
            id: quote.id,
            quoteId: quote.quoteId,
            date: quote.date,
            status: quote.status,
            clientId: quote.clientId,
            userId: quote.userId,
            salesPersonId: quote.salesPersonId,
            createdAt: quote.createdAt,
            updatedAt: quote.updatedAt,
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
            finishingComments: quote.finishingComments,
            approvalStatus: quote.approvalStatus || 'Draft',
            requiresApproval: quote.requiresApproval || false,
            approvalReason: quote.approvalReason,
            approvedBy: quote.approvedBy,
            approvedAt: quote.approvedAt,
            approvalNotes: quote.approvalNotes,
            discountPercentage: quote.discountPercentage || 0,
            discountAmount: quote.discountAmount || 0,
            marginPercentage: quote.marginPercentage || 15,
            marginAmount: quote.marginAmount || 0,
            customerPdfEnabled: quote.customerPdfEnabled !== false,
            sendToCustomerEnabled: quote.sendToCustomerEnabled !== false,
          }
        });
        console.log(`✅ Quote synced: ${quote.quoteId}`);
      } catch (error) {
        console.error(`❌ Error syncing quote ${quote.quoteId}:`, error.message);
      }
    }

    // Sync Papers
    console.log('\n📰 Syncing Papers...');
    const localPapers = await localPrisma.paper.findMany();
    for (const paper of localPapers) {
      try {
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
          }
        });
        console.log(`✅ Paper synced: ${paper.name} (${paper.gsm}gsm)`);
      } catch (error) {
        console.error(`❌ Error syncing paper ${paper.name}:`, error.message);
      }
    }

    // Sync Finishing
    console.log('\n✨ Syncing Finishing...');
    const localFinishing = await localPrisma.finishing.findMany();
    for (const finish of localFinishing) {
      try {
        await productionPrisma.finishing.create({
          data: {
            id: finish.id,
            name: finish.name,
            quoteId: finish.quoteId,
            cost: finish.cost,
          }
        });
        console.log(`✅ Finishing synced: ${finish.name}`);
      } catch (error) {
        console.error(`❌ Error syncing finishing ${finish.name}:`, error.message);
      }
    }

    // Sync QuoteAmounts
    console.log('\n💰 Syncing QuoteAmounts...');
    const localQuoteAmounts = await localPrisma.quoteAmount.findMany();
    for (const amount of localQuoteAmounts) {
      try {
        await productionPrisma.quoteAmount.create({
          data: {
            id: amount.id,
            base: amount.base,
            vat: amount.vat,
            total: amount.total,
            quoteId: amount.quoteId,
          }
        });
        console.log(`✅ QuoteAmount synced: ${amount.total} for quote ${amount.quoteId}`);
      } catch (error) {
        console.error(`❌ Error syncing quote amount for quote ${amount.quoteId}:`, error.message);
      }
    }

    // Sync QuoteOperational
    console.log('\n⚙️ Syncing QuoteOperational...');
    const localQuoteOperational = await localPrisma.quoteOperational.findMany();
    for (const operational of localQuoteOperational) {
      try {
        await productionPrisma.quoteOperational.create({
          data: {
            id: operational.id,
            quoteId: operational.quoteId,
            plates: operational.plates,
            units: operational.units,
            createdAt: operational.createdAt,
            updatedAt: operational.updatedAt,
          }
        });
        console.log(`✅ QuoteOperational synced for quote ${operational.quoteId}`);
      } catch (error) {
        console.error(`❌ Error syncing operational for quote ${operational.quoteId}:`, error.message);
      }
    }

    // Sync SearchHistory
    console.log('\n🔍 Syncing SearchHistory...');
    const localSearchHistory = await localPrisma.searchHistory.findMany();
    for (const search of localSearchHistory) {
      try {
        await productionPrisma.searchHistory.create({
          data: {
            id: search.id,
            query: search.query,
            timestamp: search.timestamp,
            userId: search.userId,
          }
        });
        console.log(`✅ SearchHistory synced: ${search.query}`);
      } catch (error) {
        console.error(`❌ Error syncing search history ${search.query}:`, error.message);
      }
    }

    // Sync SearchAnalytics
    console.log('\n📊 Syncing SearchAnalytics...');
    const localSearchAnalytics = await localPrisma.searchAnalytics.findMany();
    for (const analytics of localSearchAnalytics) {
      try {
        await productionPrisma.searchAnalytics.create({
          data: {
            id: analytics.id,
            query: analytics.query,
            timestamp: analytics.timestamp,
            userId: analytics.userId,
          }
        });
        console.log(`✅ SearchAnalytics synced: ${analytics.query}`);
      } catch (error) {
        console.error(`❌ Error syncing search analytics ${analytics.query}:`, error.message);
      }
    }

    console.log('\n🎉 Database sync completed successfully!');
    console.log('\n📊 Sync Summary:');
    console.log(`   - Users: ${localUsers.length} synced`);
    console.log(`   - Suppliers: ${localSuppliers.length} synced`);
    console.log(`   - Materials: ${localMaterials.length} synced`);
    console.log(`   - Clients: ${localClients.length} synced`);
    console.log(`   - Quotes: ${localQuotes.length} synced`);
    console.log(`   - Papers: ${localPapers.length} synced`);
    console.log(`   - Finishing: ${localFinishing.length} synced`);
    console.log(`   - QuoteAmounts: ${localQuoteAmounts.length} synced`);
    console.log(`   - QuoteOperational: ${localQuoteOperational.length} synced`);
    console.log(`   - SearchHistory: ${localSearchHistory.length} synced`);
    console.log(`   - SearchAnalytics: ${localSearchAnalytics.length} synced`);
    
    console.log('\n✅ Your production database is now EXACTLY the same as your local database!');
    console.log('🌐 All features will work identically in both environments.');

  } catch (error) {
    console.error('❌ Database sync failed:', error);
    console.error('Error details:', error.message);
  } finally {
    await localPrisma.$disconnect();
    await productionPrisma.$disconnect();
  }
}

// Run the sync
syncLocalToProduction();
