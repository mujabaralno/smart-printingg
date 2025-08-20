import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Seed users
    await DatabaseService.seedUsers();
    
    // Seed clients
    await DatabaseService.seedClients();
    
    return NextResponse.json({ 
      message: 'Database seeded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error seeding database:', error);
    return NextResponse.json(
      { error: 'Failed to seed database' },
      { status: 500 }
    );
  }
}
