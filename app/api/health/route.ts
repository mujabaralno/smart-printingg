import { NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('🏥 Health check API called');
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'unknown',
      message: 'SmartPrint API is running'
    });
  } catch (error) {
    console.error('💥 Health check failed:', error);
    return NextResponse.json(
      { 
        status: 'unhealthy',
        error: 'Health check failed',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
