import { NextRequest, NextResponse } from 'next/server';
import { db, pigAlerts } from '@/lib/db';
import { eq, desc } from 'drizzle-orm';

// Get active alerts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const resolved = searchParams.get('resolved') === 'true';
    const limit = parseInt(searchParams.get('limit') || '50');

    const alerts = await db
      .select()
      .from(pigAlerts)
      .where(eq(pigAlerts.resolved, resolved))
      .orderBy(desc(pigAlerts.timestamp))
      .limit(limit);

    return NextResponse.json({
      alerts,
      total: alerts.length,
      resolved,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching alerts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    );
  }
}

// Mark alert as resolved
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { alertId, farmerNotes, actionTaken } = body;

    if (!alertId) {
      return NextResponse.json(
        { error: 'Alert ID is required' },
        { status: 400 }
      );
    }

    const result = await db
      .update(pigAlerts)
      .set({
        resolved: true,
        resolvedAt: new Date(),
        farmerNotes: farmerNotes || null,
        actionTaken: actionTaken || null
      })
      .where(eq(pigAlerts.id, parseInt(alertId)))
      .returning();

    if (result.length === 0) {
      return NextResponse.json(
        { error: 'Alert not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      alert: result[0],
      message: 'Alert marked as resolved'
    });

  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json(
      { error: 'Failed to update alert' },
      { status: 500 }
    );
  }
}