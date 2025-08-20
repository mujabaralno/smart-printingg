import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

// Fallback demo users for when database is not available
const DEMO_USERS = [
  {
    id: "admin-001",
    email: "admin@example.com",
    name: "John Admin",
    role: "admin",
    password: "admin123",
    profilePicture: null,
    status: "Active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "estimator-001",
    email: "estimator@example.com",
    name: "Sarah Estimator",
    role: "estimator",
    password: "estimator123",
    profilePicture: null,
    status: "Active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: "user-001",
    email: "user@example.com",
    name: "Mike User",
    role: "user",
    password: "user123",
    profilePicture: null,
    status: "Active",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export async function GET() {
  try {
    console.log('👥 Users API called - attempting to fetch from database');
    
    // Try to get users from database first
    const users = await DatabaseService.getAllUsers();
    console.log(`✅ Successfully fetched ${users.length} users from database`);
    return NextResponse.json(users);
  } catch (error) {
    console.error('❌ Database error, falling back to demo users:', error);
    
    // Return demo users as fallback
    console.log('🔄 Returning demo users as fallback');
    return NextResponse.json(DEMO_USERS);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const user = await DatabaseService.createUser(body);
    return NextResponse.json(user);
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    );
  }
}

