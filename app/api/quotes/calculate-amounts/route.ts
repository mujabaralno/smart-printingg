import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/database-unified';

export async function POST(request: NextRequest) {
  try {
    console.log('🔢 CALCULATE AMOUNTS: Starting amount calculation for quotes...');
    
    // Get all quotes without amounts
    const quotesWithoutAmounts = await prisma.quote.findMany({
      where: {
        amounts: null
      },
      include: {
        papers: true,
        finishing: true
      }
    });

    console.log(`📊 Found ${quotesWithoutAmounts.length} quotes without amounts`);

    const results = [];

    for (const quote of quotesWithoutAmounts) {
      try {
        // Simple amount calculation based on papers and finishing
        let basePrice = 0;
        
        // Calculate paper costs
        if (quote.papers && quote.papers.length > 0) {
          for (const paper of quote.papers) {
            if (paper.pricePerSheet && paper.enteredSheets) {
              basePrice += paper.pricePerSheet * paper.enteredSheets;
            }
          }
        }
        
        // Calculate finishing costs
        if (quote.finishing && quote.finishing.length > 0) {
          for (const finish of quote.finishing) {
            if (finish.cost) {
              basePrice += finish.cost;
            }
          }
        }
        
        // Apply quantity multiplier
        basePrice = basePrice * (quote.quantity || 1);
        
        // Simple VAT calculation (5% for UAE)
        const vatAmount = basePrice * 0.05;
        const total = basePrice + vatAmount;
        
        // Create or update amounts
        const amounts = await prisma.quoteAmount.upsert({
          where: { quoteId: quote.id },
          update: {
            base: basePrice,
            vat: vatAmount,
            total: total
          },
          create: {
            quoteId: quote.id,
            base: basePrice,
            vat: vatAmount,
            total: total
          }
        });
        
        results.push({
          quoteId: quote.quoteId,
          success: true,
          amounts
        });
        
        console.log(`✅ Calculated amounts for quote ${quote.quoteId}: Base: ${basePrice}, VAT: ${vatAmount}, Total: ${total}`);
        
      } catch (error) {
        console.error(`❌ Error calculating amounts for quote ${quote.quoteId}:`, error);
        results.push({
          quoteId: quote.quoteId,
          success: false,
          error: error.message
        });
      }
    }
    
    return NextResponse.json({
      message: `Amount calculation completed for ${quotesWithoutAmounts.length} quotes`,
      results
    });
    
  } catch (error) {
    console.error('❌ CALCULATE AMOUNTS Error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate amounts', details: error.message },
      { status: 500 }
    );
  }
}
