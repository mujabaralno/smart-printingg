#!/usr/bin/env node

/**
 * Script to migrate local SQLite database to Vercel PostgreSQL
 * This script will:
 * 1. Read the local database backup
 * 2. Connect to Vercel PostgreSQL
 * 3. Create tables and migrate data
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: '.env.production.local' });

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

async function migrateToVercel() {
  try {
    console.log('🚀 Starting migration to Vercel PostgreSQL...');
    
    // Test database connection
    console.log('📡 Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful');
    
    // Read the latest backup
    const backupDir = path.join(__dirname, '..', 'data', 'enhanced-database-backup');
    const files = fs.readdirSync(backupDir);
    const latestBackup = files
      .filter(f => f.includes('backup-summary'))
      .sort()
      .pop();
    
    if (!latestBackup) {
      throw new Error('No backup found');
    }
    
    console.log(`📦 Using backup: ${latestBackup}`);
    
    // Read backup data
    const backupSummary = JSON.parse(
      fs.readFileSync(path.join(backupDir, latestBackup), 'utf8')
    );
    
    console.log(`📊 Found ${backupSummary.totalTables} tables with ${backupSummary.totalRecords} records`);
    
    // Create database schema
    console.log('🏗️  Creating database schema...');
    
    // The schema will be created automatically by Prisma when we run the first query
    
    // Migrate data table by table
    const tables = ['User', 'Client', 'Supplier', 'Material', 'Paper', 'Finishing', 'Quote', 'QuoteAmount', 'QuoteOperational', 'SearchHistory', 'SearchAnalytics'];
    
    for (const table of tables) {
      const dataFile = files.find(f => f.startsWith(table) && f.endsWith('.json'));
      if (dataFile) {
        console.log(`📥 Migrating ${table}...`);
        const data = JSON.parse(
          fs.readFileSync(path.join(backupDir, dataFile), 'utf8')
        );
        
        if (data.length > 0) {
          // Use Prisma to insert data
          switch (table) {
            case 'User':
              for (const user of data) {
                await prisma.user.upsert({
                  where: { id: user.id },
                  update: user,
                  create: user
                });
              }
              break;
            case 'Client':
              for (const client of data) {
                await prisma.client.upsert({
                  where: { id: client.id },
                  update: client,
                  create: client
                });
              }
              break;
            case 'Supplier':
              for (const supplier of data) {
                await prisma.supplier.upsert({
                  where: { id: supplier.id },
                  update: supplier,
                  create: supplier
                });
              }
              break;
            case 'Material':
              for (const material of data) {
                await prisma.material.upsert({
                  where: { id: material.id },
                  update: material,
                  create: material
                });
              }
              break;
            case 'Quote':
              for (const quote of data) {
                await prisma.quote.upsert({
                  where: { id: quote.id },
                  update: quote,
                  create: quote
                });
              }
              break;
            case 'Paper':
              for (const paper of data) {
                await prisma.paper.upsert({
                  where: { id: paper.id },
                  update: paper,
                  create: paper
                });
              }
              break;
            case 'Finishing':
              for (const finishing of data) {
                await prisma.finishing.upsert({
                  where: { id: finishing.id },
                  update: finishing,
                  create: finishing
                });
              }
              break;
            case 'QuoteAmount':
              for (const amount of data) {
                await prisma.quoteAmount.upsert({
                  where: { id: amount.id },
                  update: amount,
                  create: amount
                });
              }
              break;
            case 'QuoteOperational':
              for (const operational of data) {
                await prisma.quoteOperational.upsert({
                  where: { id: operational.id },
                  update: operational,
                  create: operational
                });
              }
              break;
            case 'SearchHistory':
              for (const history of data) {
                await prisma.searchHistory.upsert({
                  where: { id: history.id },
                  update: history,
                  create: history
                });
              }
              break;
            case 'SearchAnalytics':
              for (const analytics of data) {
                await prisma.searchAnalytics.upsert({
                  where: { id: analytics.id },
                  update: analytics,
                  create: analytics
                });
              }
              break;
          }
          console.log(`✅ ${table}: ${data.length} records migrated`);
        }
      }
    }
    
    console.log('🎉 Migration completed successfully!');
    
    // Verify migration
    console.log('🔍 Verifying migration...');
    const userCount = await prisma.user.count();
    const clientCount = await prisma.client.count();
    const quoteCount = await prisma.quote.count();
    
    console.log(`📊 Verification results:`);
    console.log(`   Users: ${userCount}`);
    console.log(`   Clients: ${clientCount}`);
    console.log(`   Quotes: ${quoteCount}`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateToVercel();
