import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET() {
  try {
    console.log('🔍 Fetching quotes from PostgreSQL database...');
    
    // Use direct Prisma client with simplified query
    const quotes = await prisma.quote.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            id: true,
            companyName: true,
            contactPerson: true,
            email: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });
    
    console.log(`✅ Found ${quotes.length} quotes`);
    
    // Transform the data to match expected format
    const transformedQuotes = quotes.map(quote => ({
      id: quote.id,
      quoteId: quote.quoteId,
      date: quote.date,
      status: quote.status,
      clientId: quote.clientId,
      userId: quote.userId,
      product: quote.product,
      quantity: quote.quantity,
      sides: quote.sides,
      printing: quote.printing,
      colors: quote.colors,
      createdAt: quote.createdAt,
      updatedAt: quote.updatedAt,
      productName: quote.productName || quote.product,
      printingSelection: quote.printingSelection || quote.printing,
      flatSizeWidth: quote.flatSizeWidth,
      flatSizeHeight: quote.flatSizeHeight,
      flatSizeSpine: quote.flatSizeSpine,
      closeSizeWidth: quote.closeSizeWidth,
      closeSizeHeight: quote.closeSizeHeight,
      closeSizeSpine: quote.closeSizeSpine,
      useSameAsFlat: quote.useSameAsFlat || false,
      client: quote.client,
      user: quote.user
    }));
    
    return NextResponse.json(transformedQuotes);
    
  } catch (error) {
    console.error('❌ Error fetching quotes:', error);
    return NextResponse.json(
      { error: 'Failed to fetch quotes', details: error.message },
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
    
    // Validate userId if provided
    if (body.userId) {
      try {
        // Use relative URL instead of environment variable for better production compatibility
        const userResponse = await fetch(`${request.nextUrl.origin}/api/users/${body.userId}`);
        if (!userResponse.ok) {
          console.log(`Invalid userId: ${body.userId}`);
          // Remove invalid userId instead of failing
          delete body.userId;
        }
      } catch (error) {
        console.log(`Error validating userId: ${body.userId}, removing it`);
        delete body.userId;
      }
    }
    
    // Validate that clientId exists
    try {
      const client = await prisma.client.findUnique({ where: { id: body.clientId } });
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

    // Validate and clean papers array
    if (body.papers && body.papers.length > 0) {
      body.papers = body.papers.map((paper: any) => ({
        name: paper.name || "Standard Paper",
        gsm: paper.gsm ? Number(paper.gsm) : 150, // Convert gsm to number
        inputWidth: paper.inputWidth ? Number(paper.inputWidth) : null,
        inputHeight: paper.inputHeight ? Number(paper.inputHeight) : null,
        pricePerPacket: paper.pricePerPacket ? Number(paper.pricePerPacket) : null,
        pricePerSheet: paper.pricePerSheet ? Number(paper.pricePerSheet) : null,
        sheetsPerPacket: paper.sheetsPerPacket ? Number(paper.sheetsPerPacket) : null,
        recommendedSheets: paper.recommendedSheets ? Number(paper.recommendedSheets) : null,
        enteredSheets: paper.enteredSheets ? Number(paper.enteredSheets) : null,
        outputWidth: paper.outputWidth ? Number(paper.outputWidth) : null,
        outputHeight: paper.outputHeight ? Number(paper.outputHeight) : null,
        selectedColors: paper.selectedColors ? String(paper.selectedColors) : null,
      }));
    }

    // Validate and clean finishing array
    if (body.finishing && body.finishing.length > 0) {
      body.finishing = body.finishing.map((finish: any) => ({
        name: finish.name || "Standard Finishing",
        cost: finish.cost ? Number(finish.cost) : 0,
      }));
    }
    
    // Ensure amounts object exists
    if (!body.amounts) {
      body.amounts = {
        base: 0,
        vat: 0,
        total: 0
      };
    }
    
    // Process Step 3 product specification data
    if (body.products && body.products.length > 0) {
      const product = body.products[0]; // Take the first product for now
      
      // Map Step 3 fields to the new database columns
      body.productName = product.productName || body.product;
      body.printingSelection = product.printingSelection || body.printing;
      
      // Map size specifications
      if (product.flatSize) {
        body.flatSizeWidth = product.flatSize.width;
        body.flatSizeHeight = product.flatSize.height;
        body.flatSizeSpine = product.flatSize.spine;
      }
      
      if (product.closeSize) {
        body.closeSizeWidth = product.closeSize.width;
        body.closeSizeHeight = product.closeSize.height;
        body.closeSizeSpine = product.closeSize.spine;
      }
      
      body.useSameAsFlat = product.useSameAsFlat || false;
      
      // Map colors if available - ensure it's a string
      if (product.colors) {
        if (typeof product.colors === 'object') {
          body.colors = JSON.stringify(product.colors);
        } else {
          body.colors = String(product.colors);
        }
      }
      
      // Map papers if available
      if (product.papers && product.papers.length > 0) {
        body.papers = product.papers;
      }
      
      // Map finishing if available
      if (product.finishing && product.finishing.length > 0) {
        body.finishing = product.finishing;
      }
      
      // Map finishing comments if available
      if (product.finishingComments) {
        body.finishingComments = product.finishingComments;
      }
    }
    
    console.log('Processed quote data:', JSON.stringify(body, null, 2));
    
    try {
      // Use the new method that handles complete quote creation with related data
      const quote = await prisma.quote.create({
        data: body,
        include: {
          client: true,
          user: true,
          quoteAmount: true
        }
      });
      console.log('Quote created successfully with all details:', quote.id);
      return NextResponse.json(quote);
    } catch (prismaError) {
      console.error('Prisma error details:', prismaError);
      
      // Provide more specific error information for Prisma errors
      if (prismaError.code === 'P2002') {
        return NextResponse.json(
          { error: 'Quote ID already exists. Please try again.' },
          { status: 400 }
        );
      } else if (prismaError.code === 'P2003') {
        return NextResponse.json(
          { error: 'Invalid reference. Client or user not found.' },
          { status: 400 }
        );
      } else if (prismaError.code === 'P2011') {
        return NextResponse.json(
          { error: 'Null constraint violation. Required fields are missing.' },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          { error: `Database error: ${prismaError.message}` },
          { status: 500 }
        );
      }
    }
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

