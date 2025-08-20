import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    
    if (!query) {
      return NextResponse.json({ error: 'Query parameter is required' }, { status: 400 });
    }

    // Search quotes
    const quotes = await DatabaseService.getAllQuotes();
    const quoteResults = quotes
      .filter(quote => 
        quote.quoteId.toLowerCase().includes(query.toLowerCase()) ||
        quote.client?.contactPerson?.toLowerCase().includes(query.toLowerCase()) ||
        quote.client?.companyName?.toLowerCase().includes(query.toLowerCase()) ||
        quote.product.toLowerCase().includes(query.toLowerCase())
      )
      .map(quote => ({
        id: quote.id,
        type: 'quote' as const,
        title: quote.quoteId,
        subtitle: `${quote.client?.contactPerson || quote.client?.companyName} - ${quote.product}`,
        data: quote
      }));

    // Search clients
    const clients = await DatabaseService.getAllClients();
    const clientResults = clients
      .filter(client => 
        client.contactPerson.toLowerCase().includes(query.toLowerCase()) ||
        client.companyName?.toLowerCase().includes(query.toLowerCase()) ||
        client.email.toLowerCase().includes(query.toLowerCase())
      )
      .map(client => ({
        id: client.id,
        type: 'client' as const,
        title: client.contactPerson || client.companyName || 'Unknown',
        subtitle: client.email,
        data: client
      }));

    const results = [...quoteResults, ...clientResults];
    
    return NextResponse.json(results);
  } catch (error) {
    console.error('Error performing search:', error);
    return NextResponse.json(
      { error: 'Failed to perform search' },
      { status: 500 }
    );
  }
}

