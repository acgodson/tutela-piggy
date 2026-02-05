import { NextRequest, NextResponse } from 'next/server';
import { db, videoSessions } from '@/lib/db';
import { eq } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: connectionId } = await params;
    
    // Get status from database first
    let dbSession = null;
    try {
      const sessions = await db
        .select()
        .from(videoSessions)
        .where(eq(videoSessions.batchId, connectionId))
        .limit(1);
      
      dbSession = sessions[0] || null;
    } catch (dbError) {
      console.error('Database query failed:', dbError);
    }
    
    // Proxy to EC2 backend for real-time status
    const backendResponse = await fetch(`${process.env.API_ENDPOINT}/video/status/${connectionId}`);
    
    if (!backendResponse.ok) {
      if (backendResponse.status === 404) {
        return NextResponse.json(
          { error: 'Connection not found' },
          { status: 404 }
        );
      }
      throw new Error(`Backend request failed: ${backendResponse.status}`);
    }

    const backendResult = await backendResponse.json();
    
    // Update database with latest status
    if (dbSession && backendResult.status !== dbSession.status) {
      try {
        await db
          .update(videoSessions)
          .set({
            processedFrames: backendResult.processed_frames || dbSession.processedFrames,
            status: backendResult.status,
            completedAt: backendResult.status === 'completed' ? new Date() : null
          })
          .where(eq(videoSessions.batchId, connectionId));
      } catch (dbError) {
        console.error('Database update failed:', dbError);
      }
    }
    
    // Combine database and backend data
    const result = {
      ...backendResult,
      filename: dbSession?.filename,
      camera_id: dbSession?.cameraId,
      started_at: dbSession?.startedAt,
      completed_at: dbSession?.completedAt
    };
    
    return NextResponse.json(result);

  } catch (error) {
    console.error('Video status error:', error);
    return NextResponse.json(
      { error: 'Failed to get video status', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}