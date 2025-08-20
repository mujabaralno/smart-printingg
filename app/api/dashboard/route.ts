import { NextResponse } from 'next/server';
import { HybridDatabaseService } from '@/lib/database-hybrid';

export async function GET() {
  try {
    console.log('📈 Dashboard API called - fetching statistics');
    
    // Get dashboard statistics
    const stats = await HybridDatabaseService.getDashboardStats();
    console.log('✅ Dashboard stats:', stats);
    
    // Get recent quotes with client information
    const quotes = await HybridDatabaseService.getQuotesWithClients();
    const recentQuotes = quotes.slice(0, 10); // Get last 10 quotes
    
    return NextResponse.json({
      success: true,
      stats,
      recentQuotes,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error fetching dashboard data:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch dashboard data',
        stats: {
          totalQuotes: 0,
          approved: 0,
          pending: 0,
          rejected: 0,
          completed: 0
        },
        recentQuotes: []
      },
      { status: 500 }
    );
  }
}
