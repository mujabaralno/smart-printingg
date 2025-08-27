const fs = require('fs');
const path = require('path');

// This script switches Prisma schema back to SQLite for local development

async function switchToLocal() {
  try {
    console.log('🔄 Switching to Local SQLite Schema...');
    
    // Read the local SQLite schema
    const localSchemaPath = path.join(__dirname, '../prisma/schema-local.sqlite.prisma');
    const localSchema = fs.readFileSync(localSchemaPath, 'utf8');
    
    // Write it to the main schema file
    const mainSchemaPath = path.join(__dirname, '../prisma/schema.prisma');
    fs.writeFileSync(mainSchemaPath, localSchema);
    
    console.log('✅ Schema switched to SQLite for local development');
    console.log('📝 Run "npx prisma generate" to update Prisma client');
    console.log('🌐 For production, use the sync script to update Vercel database');
    
  } catch (error) {
    console.error('❌ Failed to switch schema:', error.message);
  }
}

switchToLocal();
