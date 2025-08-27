const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// This script forces Prisma to regenerate the client with PostgreSQL schema
// This is the root cause of the "SQLite provider" issue

async function forcePrismaRegeneration() {
  try {
    console.log('🚨 FORCING PRISMA CLIENT REGENERATION...');
    console.log('📊 This will fix the "SQLite provider" issue\n');

    // Check current working directory
    console.log('📁 Current working directory:', process.cwd());
    
    // Check if we're in the right place
    if (!fs.existsSync('prisma/schema.prisma')) {
      console.error('❌ prisma/schema.prisma not found. Please run this from the project root.');
      return;
    }

    // Check current schema content
    console.log('\n📋 Checking current Prisma schema...');
    const schemaContent = fs.readFileSync('prisma/schema.prisma', 'utf8');
    const isPostgreSQL = schemaContent.includes('provider = "postgresql"');
    const isSQLite = schemaContent.includes('provider = "sqlite"');
    
    console.log(`   Schema provider: ${isPostgreSQL ? 'PostgreSQL' : isSQLite ? 'SQLite' : 'Unknown'}`);
    console.log(`   DATABASE_URL usage: ${schemaContent.includes('env("DATABASE_URL")') ? 'Yes' : 'No'}`);

    if (!isPostgreSQL) {
      console.error('❌ Schema is not configured for PostgreSQL!');
      console.log('   Please update prisma/schema.prisma first.');
      return;
    }

    // Check if node_modules exists
    console.log('\n📦 Checking Prisma installation...');
    if (!fs.existsSync('node_modules/@prisma/client')) {
      console.log('   Installing Prisma dependencies...');
      execSync('npm install', { stdio: 'inherit' });
    }

    // Force remove existing Prisma client
    console.log('\n🗑️ Removing existing Prisma client...');
    try {
      if (fs.existsSync('node_modules/.prisma')) {
        execSync('rm -rf node_modules/.prisma', { stdio: 'inherit' });
        console.log('✅ Existing Prisma client removed');
      }
      if (fs.existsSync('node_modules/@prisma/client')) {
        execSync('rm -rf node_modules/@prisma/client', { stdio: 'inherit' });
        console.log('✅ Existing Prisma client package removed');
      }
    } catch (error) {
      console.log('⚠️ Could not remove existing Prisma client:', error.message);
    }

    // Reinstall Prisma client
    console.log('\n📥 Reinstalling Prisma client...');
    try {
      execSync('npm install @prisma/client', { stdio: 'inherit' });
      console.log('✅ Prisma client reinstalled');
    } catch (error) {
      console.error('❌ Failed to reinstall Prisma client:', error.message);
      return;
    }

    // Force regenerate Prisma client
    console.log('\n🔧 Regenerating Prisma client...');
    try {
      execSync('npx prisma generate', { stdio: 'inherit' });
      console.log('✅ Prisma client regenerated');
    } catch (error) {
      console.error('❌ Failed to regenerate Prisma client:', error.message);
      return;
    }

    // Verify the generated client
    console.log('\n✅ Verification...');
    if (fs.existsSync('node_modules/.prisma/client/index.js')) {
      console.log('✅ Prisma client files exist');
      
      // Check if the client was generated with PostgreSQL
      const clientContent = fs.readFileSync('node_modules/.prisma/client/index.js', 'utf8');
      if (clientContent.includes('postgresql') || clientContent.includes('postgres')) {
        console.log('✅ Client appears to be PostgreSQL-compatible');
      } else {
        console.log('⚠️ Client may not be PostgreSQL-compatible');
      }
    } else {
      console.error('❌ Prisma client files not found after generation');
    }

    // Check package.json scripts
    console.log('\n📋 Package.json scripts:');
    const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    console.log(`   Build script: ${packageJson.scripts.build}`);
    console.log(`   Postinstall script: ${packageJson.scripts.postinstall}`);

    console.log('\n🎉 PRISMA CLIENT REGENERATION COMPLETED!');
    console.log('\n📋 Next steps:');
    console.log('1. Commit and push these changes to GitHub');
    console.log('2. Wait for Vercel to redeploy (2-5 minutes)');
    console.log('3. The new Prisma client will use PostgreSQL schema');
    console.log('4. All data access issues should be resolved');
    console.log('\n⚠️ IMPORTANT: This fix addresses the root cause - old Prisma client');

  } catch (error) {
    console.error('❌ Prisma regeneration failed:', error);
    console.error('Error details:', error.message);
  }
}

// Run the regeneration
forcePrismaRegeneration();
