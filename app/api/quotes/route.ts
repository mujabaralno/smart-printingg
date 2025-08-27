import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database';

export async function GET() {
  try {
    console.log('🔍 Fetching quotes from PostgreSQL database...');
    
    // Use direct Prisma client with comprehensive query
    const quotes = await prisma.quote.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        client: {
          select: {
            id: true,
            clientType: true,
            companyName: true,
            contactPerson: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            countryCode: true,
            role: true,
            status: true,
            address: true,
            city: true,
            state: true,
            postalCode: true,
            country: true,
            designation: true,
            emails: true,
            trn: true,
            hasNoTrn: true,
            area: true,
            createdAt: true,
            updatedAt: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            status: true
          }
        },
        amounts: true,
        papers: true,
        finishing: true,
        QuoteOperational: true
      }
    });
    
    console.log(`✅ Found ${quotes.length} quotes`);
    
    // Transform the data to match expected format
    const transformedQuotes = quotes.map(quote => {
      // Get client display name
      let clientDisplayName = "N/A";
      if (quote.client) {
        if (quote.client.clientType === "Company" && quote.client.companyName) {
          clientDisplayName = quote.client.companyName;
        } else if (quote.client.firstName && quote.client.lastName) {
          clientDisplayName = `${quote.client.firstName} ${quote.client.lastName}`;
        } else if (quote.client.contactPerson) {
          clientDisplayName = quote.client.contactPerson;
        } else if (quote.client.email) {
          clientDisplayName = quote.client.email;
        }
      }

      return {
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
        client: {
          ...quote.client,
          displayName: clientDisplayName
        },
        user: quote.user,
        amounts: quote.amounts,
        papers: quote.papers,
        finishing: quote.finishing,
        QuoteOperational: quote.QuoteOperational
      };
    });
    
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
      
      // Map papers if available - use nested create syntax
      if (product.papers && product.papers.length > 0) {
        body.papers = {
          create: product.papers.map((paper: any) => ({
            name: paper.name || "Standard Paper",
            gsm: paper.gsm ? String(paper.gsm) : "150", // Convert to string as per schema
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
          }))
        };
      }
      
      // Map finishing if available - use nested create syntax
      if (product.finishing && product.finishing.length > 0) {
        body.finishing = {
          create: product.finishing.map((finish: any) => ({
            name: finish.name || "Standard Finishing",
            cost: finish.cost ? Number(finish.cost) : 0,
          }))
        };
      }
      
      // Map finishing comments if available
      if (product.finishingComments) {
        body.finishingComments = product.finishingComments;
      }
    }
    
    // Handle amounts - use nested create syntax for QuoteAmount
    if (body.amounts) {
      body.amounts = {
        create: {
          base: Number(body.amounts.base) || 0,
          vat: Number(body.amounts.vat) || 0,
          total: Number(body.amounts.total) || 0,
        }
      };
    }
    
    // Handle QuoteOperational - use nested create syntax
    if (body.QuoteOperational) {
      body.QuoteOperational = {
        create: {
          plates: Number(body.QuoteOperational.plates) || 0,
          units: Number(body.QuoteOperational.units) || 0,
        }
      };
    }
    
    console.log('=== API DEBUG: AMOUNTS DATA ===');
    console.log('Raw amounts from body:', body.amounts);
    console.log('Processed amounts:', body.amounts);
    console.log('Processed quote data:', JSON.stringify(body, null, 2));
    
    try {
      // Use the new method that handles complete quote creation with related data
      const quote = await prisma.quote.create({
        data: body,
        include: {
          client: true,
          user: true,
          amounts: true,
          papers: true,
          finishing: true,
          QuoteOperational: true
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

