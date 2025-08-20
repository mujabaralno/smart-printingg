import { NextRequest, NextResponse } from 'next/server';
import { HybridDatabaseService } from '@/lib/database-hybrid';

export async function GET() {
  try {
    console.log('📊 Quotes API called - fetching dashboard data');
    
    // Get quotes with client information
    const quotes = await HybridDatabaseService.getQuotesWithClients();
    console.log(`✅ Successfully fetched ${quotes.length} quotes`);
    
    return NextResponse.json(quotes);
  } catch (error) {
    console.error('❌ Error fetching quotes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const quote = await HybridDatabaseService.createQuote(body);
    return NextResponse.json(quote);
  } catch (error) {
    console.error('Error creating quote:', error);
    return NextResponse.json(
      { error: 'Failed to create quote' },
      { status: 500 }
    );
  }
}

