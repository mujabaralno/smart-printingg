import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database';

export async function GET() {
  try {
    const quotes = await DatabaseService.getAllQuotes();
    return NextResponse.json(quotes);
  } catch (error) {
    console.error('Error fetching quotes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Received quote data:', JSON.stringify(body, null, 2));
    
    // Validate required fields
    const requiredFields = ['quoteId', 'clientId', 'product', 'quantity', 'sides', 'printing'];
    for (const field of requiredFields) {
      if (!body[field]) {
        console.log(`Missing required field: ${field}`);
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }
    
    // Validate that clientId exists
    try {
      const client = await DatabaseService.getClientById(body.clientId);
      if (!client) {
        console.log(`Client with ID ${body.clientId} not found`);
        return NextResponse.json(
          { error: `Client with ID ${body.clientId} not found` },
          { status: 400 }
        );
      }
      console.log('Client found:', client.id, client.contactPerson);
    } catch (clientError) {
      console.error('Error checking client:', clientError);
      return NextResponse.json(
        { error: 'Invalid client ID' },
        { status: 400 }
      );
    }
    
    // Ensure papers and finishing are arrays
    if (!Array.isArray(body.papers)) {
      body.papers = [];
    }
    if (!Array.isArray(body.finishing)) {
      body.finishing = [];
    }
    
    // Ensure amounts object exists
    if (!body.amounts) {
      body.amounts = {
        base: 0,
        vat: 0,
        total: 0
      };
    }
    
    console.log('Processed quote data:', JSON.stringify(body, null, 2));
    
    // Use the new method that handles complete quote creation with related data
    const quote = await DatabaseService.createQuoteWithDetails(body);
    console.log('Quote created successfully with all details:', quote.id);
    return NextResponse.json(quote);
  } catch (error) {
    console.error('Error creating quote:', error);
    
    // Provide more specific error information
    if (error instanceof Error) {
      return NextResponse.json(
        { error: `Failed to create quote: ${error.message}` },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create quote' },
      { status: 500 }
    );
  }
}

