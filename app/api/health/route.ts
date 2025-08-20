import { NextResponse } from 'next/server';
import { checkDatabaseConnection } from '@/lib/database-vercel';

export async function GET() {
  try {
    console.log('🏥 Health check API called');
    
    // Check database connectivity
    const dbStatus = await checkDatabaseConnection();
    
    const healthStatus = {
      status: dbStatus.status === 'connected' ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      message: 'SmartPrint API is running',
      database: dbStatus,
      checks: {
        api: 'healthy',
        database: dbStatus.status === 'connected' ? 'healthy' : 'unhealthy',
        environment: process.env.DATABASE_URL ? 'configured' : 'missing_database_url'
      }
    };
    
    if (dbStatus.status === 'connected') {
      return NextResponse.json(healthStatus);
    } else {
      return NextResponse.json(healthStatus, { status: 503 });
    }
  } catch (error) {
    console.error('💥 Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString(),
        database: { status: 'unknown', error: 'Health check error' }
      },
      { status: 500 }
    );
  }
}
