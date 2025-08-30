import { NextRequest, NextResponse } from 'next/server';
import { DatabaseService } from '@/lib/database-unified';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Getting quote with ID:', id);
    
    const dbService = new DatabaseService();
    const quote = await dbService.getQuoteById(id);
    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }
    
    // Transform the quote data to ensure finishing is in the correct format
    const transformedQuote = {
      ...quote,
      // Transform finishing from array of objects to array of objects with name property
      finishing: quote.finishing?.map(f => ({ name: f.name })) || [],
      // Transform papers to simplified format
      papers: quote.papers?.map(p => ({
        name: p.name,
        gsm: p.gsm
      })) || []
    };
    
    console.log('Transformed quote data:', {
      id: transformedQuote.id,
      finishing: transformedQuote.finishing,
      papers: transformedQuote.papers
    });
    
    return NextResponse.json(transformedQuote);
    
  } catch (error) {
    console.error('Error getting quote:', error);
    return NextResponse.json(
      { error: 'Failed to get quote', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    console.log('Updating quote with ID:', id);
    console.log('Update data:', body);
    
    // Update the quote with all related data
    const dbService = new DatabaseService();
    const updatedQuote = await dbService.updateQuoteWithDetails(id, body);
    
    if (!updatedQuote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }
    
    console.log('Quote updated successfully:', updatedQuote.id);
    return NextResponse.json(updatedQuote);
    
  } catch (error) {
    console.error('Error updating quote:', error);
    return NextResponse.json(
      { error: 'Failed to update quote', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    console.log('Updating quote status with ID:', id);
    console.log('Status update data:', body);
    
    // Update only the quote status
    const dbService = new DatabaseService();
    const updatedQuote = await dbService.updateQuoteStatus(id, body.status);
    
    if (!updatedQuote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }
    
    console.log('Quote status updated successfully:', updatedQuote.id, 'to', body.status);
    return NextResponse.json(updatedQuote);
    
  } catch (error) {
    console.error('Error updating quote status:', error);
    return NextResponse.json(
      { error: 'Failed to update quote status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    console.log('Deleting quote with ID:', id);
    
    // Delete the quote
    const deletedQuote = await dbService.deleteQuote(id);
    
    if (!deletedQuote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      );
    }
    
    console.log('Quote deleted successfully:', deletedQuote.id);
    return NextResponse.json({ message: 'Quote deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting quote:', error);
    return NextResponse.json(
      { error: 'Failed to delete quote', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

