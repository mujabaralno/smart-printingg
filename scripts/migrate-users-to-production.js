import { PrismaClient } from '@prisma/client';

// This script will use the production DATABASE_URL from environment
const prisma = new PrismaClient();

// Import the dummy users
const dummyUsers = [
  {
    id: "EMP001",
    name: "John Admin",
    role: "admin",
    email: "admin@example.com",
    password: "admin123",
  },
  {
    id: "EMP002",
    name: "Jane Estimator",
    role: "estimator",
    email: "estimator@example.com",
    password: "estimate123",
  },
  {
    id: "TEST001",
    name: "Test User",
    role: "user",
    email: "test@example.com",
    password: "test123",
  },
  {
    id: "ADMIN001",
    name: "Admin User",
    role: "admin",
    email: "admin",
    password: "admin",
  },
];

async function migrateUsersToProduction() {
  try {
    console.log('🚀 Starting user migration to production database...');
    
    // Check if we can connect to the production database
    await prisma.$connect();
    console.log('✅ Connected to production database');
    
    // Check existing users
    const existingUsers = await prisma.user.findMany({
      select: { id: true, email: true }
    });
    
    console.log(`📊 Found ${existingUsers.length} existing users in production`);
    
    if (existingUsers.length > 0) {
      console.log('⚠️  Users already exist in production. Clearing existing users...');
      await prisma.user.deleteMany({});
      console.log('✅ Cleared existing users');
    }
    
    // Migrate dummy users
    console.log('\n🔄 Migrating dummy users to production...');
    
    for (const userData of dummyUsers) {
      try {
        const user = await prisma.user.create({
          data: {
            id: userData.id,
            name: userData.name,
            email: userData.email,
            password: userData.password,
            role: userData.role,
            status: "Active",
            profilePicture: null,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        });
        
        console.log(`✅ Created user: ${user.name} (${user.email})`);
      } catch (error) {
        console.error(`❌ Failed to create user ${userData.name}:`, error);
      }
    }
    
    // Verify migration
    const finalUsers = await prisma.user.findMany();
    console.log(`\n🎉 Migration complete! Production database now has ${finalUsers.length} users`);
    
    console.log('\n📋 Production users:');
    finalUsers.forEach(user => {
      console.log(`   👤 ${user.name} (${user.email}) - Role: ${user.role}`);
    });
    
    console.log('\n🔐 Login credentials for testing:');
    console.log('   Admin: admin@example.com / admin123');
    console.log('   Estimator: estimator@example.com / estimate123');
    console.log('   Test User: test@example.com / test123');
    console.log('   Admin (simple): admin / admin');
    
    console.log('\n✅ Login should now work in production!');
    
  } catch (error) {
    console.error('❌ Error during user migration:', error);
    console.error('💡 Make sure your DATABASE_URL is set to production');
  } finally {
    await prisma.$disconnect();
  }
}

migrateUsersToProduction();
