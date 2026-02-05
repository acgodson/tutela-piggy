import { NextRequest, NextResponse } from 'next/server';
import { db, videoSessions } from '@/lib/db';


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const targetFps = (formData.get('target_fps') as string) || '2';
    const cameraId = (formData.get('camera_id') as string) || 'video-upload';
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Proxy to EC2 backend (use sync endpoint for immediate processing)
    const backendFormData = new FormData();
    backendFormData.append('file', file);
    backendFormData.append('target_fps', targetFps);
    
    const backendResponse = await fetch(`${process.env.API_ENDPOINT}/process/video/sync`, {
      method: 'POST',
      body: backendFormData,
    });

    if (!backendResponse.ok) {
      throw new Error(`Backend processing failed: ${backendResponse.status}`);
    }

    const result = await backendResponse.json();
    
    // Store video session in database
    try {
      await db.insert(videoSessions).values({
        batchId: result.connection_id || result.batch_id,
        filename: file.name,
        cameraId: cameraId,
        totalFrames: result.total_frames,
        processedFrames: result.processed_frames,
        targetFps: parseInt(targetFps),
        status: result.status,
        completedAt: result.status === 'completed' ? new Date() : null
      });
    } catch (dbError) {
      console.error('Database storage failed:', dbError);
      // Continue even if DB storage fails
    }
    
    return NextResponse.json({
      success: true,
      connection_id: result.connection_id,
      total_frames: result.total_frames,
      processed_frames: result.processed_frames,
      target_fps: parseInt(targetFps),
      status: result.status,
      results: result.results,
      total_processing_time: result.total_processing_time,
      message: result.message,
      status_url: `/api/video/status/${result.connection_id}`
    });

  } catch (error) {
    console.error('Video processing error:', error);
    return NextResponse.json(
      { error: 'Video processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}