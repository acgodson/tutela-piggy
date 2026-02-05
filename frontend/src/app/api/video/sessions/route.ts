import { NextRequest, NextResponse } from 'next/server';
import { db, videoSessions } from '@/lib/db';
import { desc, eq } from 'drizzle-orm';

// Get all video sessions
export async function GET() {
  try {
    const sessions = await db
      .select()
      .from(videoSessions)
      .orderBy(desc(videoSessions.startedAt))
      .limit(50);
    
    return NextResponse.json({
      sessions,
      total: sessions.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching video sessions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch video sessions' },
      { status: 500 }
    );
  }
}