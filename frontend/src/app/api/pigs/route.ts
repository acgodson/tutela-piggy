import { NextRequest, NextResponse } from 'next/server';
import { db, pigRegistry, NewPigRegistry } from '@/lib/db';
import { eq } from 'drizzle-orm';

// Get all registered pigs
export async function GET() {
  try {
    const pigs = await db.select().from(pigRegistry).where(eq(pigRegistry.active, true));
    
    return NextResponse.json({
      pigs,
      total: pigs.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching pigs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch pigs' },
      { status: 500 }
    );
  }
}

// Register a new pig
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { pigId, pigNumber, pigName, markerColors, birthDate, penId } = body;

    if (!pigId || !pigNumber || !penId) {
      return NextResponse.json(
        { error: 'Missing required fields: pigId, pigNumber, penId' },
        { status: 400 }
      );
    }

    const newPig: NewPigRegistry = {
      pigId,
      pigNumber,
      pigName: pigName || null,
      markerColors: markerColors || null,
      birthDate: birthDate || null,
      penId,
      active: true
    };

    const result = await db.insert(pigRegistry).values(newPig).returning();

    return NextResponse.json({
      success: true,
      pig: result[0],
      message: `Pig ${pigName} registered successfully`
    });

  } catch (error) {
    console.error('Error registering pig:', error);
    return NextResponse.json(
      { error: 'Failed to register pig' },
      { status: 500 }
    );
  }
}