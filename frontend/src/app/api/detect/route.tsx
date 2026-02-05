import { NextRequest, NextResponse } from 'next/server';
import { db, pigDetections, pigRegistry, pigAlerts } from '@/lib/db';
import { eq, and, gte, desc } from 'drizzle-orm';

// Types for backend responses
interface BackendDetection {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence: number;
  class_name: string;
  track_id: number;
  has_mask?: boolean;
  mask_area?: number;
}

interface BackendResponse {
  frame_id: number;
  timestamp: number;
  detections: BackendDetection[];
  fps: number;
  processing_time: number;
}

interface AnnotatedBackendResponse extends BackendResponse {
  pig_count: number;
  annotated_image: string; // base64 image
}

// Enhanced detection result with pig identification
interface EnhancedDetection {
  // Backend data
  bbox: { x: number; y: number; width: number; height: number };
  confidence: number;
  track_id: number;
  has_mask: boolean;
  mask_area?: number;
  
  // Pig identification
  pig_id?: string;
  pig_name?: string;
  marker_colors?: string[];
  
  // Behavior analysis (placeholder for future LLM integration)
  posture?: 'standing' | 'lying_down' | 'sitting' | 'unknown';
  activity?: 'eating' | 'drinking' | 'walking' | 'resting' | 'socializing' | 'unknown';
  movement_detected?: boolean;
}

interface ProcessedFrameResponse {
  frame_id: number;
  timestamp: string;
  camera_id: string;
  total_pigs: number;
  detections: EnhancedDetection[];
  processing_time: number;
  annotated_image?: string;
  alerts?: any[];
}

// Detect image with metadata only (fast)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const camera_id = formData.get('camera_id') as string || 'demo-camera';
    const include_annotated = formData.get('include_annotated') === 'true';
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Call Python backend for detection
    const backendFormData = new FormData();
    backendFormData.append('file', file);
    
    const backendEndpoint = include_annotated ? '/detect/image/annotated' : '/detect/image';
    const backendUrl = `${process.env.API_ENDPOINT}${backendEndpoint}`;
    
    const backendResponse = await fetch(backendUrl, {
      method: 'POST',
      body: backendFormData,
    });

    if (!backendResponse.ok) {
      throw new Error(`Backend detection failed: ${backendResponse.status}`);
    }

    const backendData: BackendResponse | AnnotatedBackendResponse = await backendResponse.json();
    
    // Load pig registry for identification
    const registeredPigs = await db.select().from(pigRegistry).where(eq(pigRegistry.active, true));
    
    // Process detections and identify pigs
    const enhancedDetections: EnhancedDetection[] = await Promise.all(
      backendData.detections.map(async (detection) => {
        // For now, we'll use a simple identification system
        // In the pilot program, this would analyze marker colors from the image crop
        const pig_id = await identifyPigFromDetection(detection, registeredPigs);
        const pig_info = registeredPigs.find(p => p.pigId === pig_id);
        
        return {
          bbox: {
            x: detection.x,
            y: detection.y,
            width: detection.width,
            height: detection.height
          },
          confidence: detection.confidence,
          track_id: detection.track_id,
          has_mask: detection.has_mask || false,
          mask_area: detection.mask_area,
          pig_id: pig_info?.pigId,
          pig_name: pig_info?.pigName ?? undefined,
          marker_colors: pig_info?.markerColors ?? undefined,
          // Placeholder behavior analysis - would be enhanced with LLM
          posture: 'unknown',
          activity: 'unknown',
          movement_detected: false
        };
      })
    );

    // Store detections in database
    const frame_number = Math.floor(backendData.timestamp);
    await storeDetections(camera_id, frame_number, enhancedDetections);
    
    // Check for alerts
    const alerts = await checkForAlerts(enhancedDetections);
    
    // Prepare response
    const response: ProcessedFrameResponse = {
      frame_id: backendData.frame_id,
      timestamp: new Date().toISOString(),
      camera_id,
      total_pigs: backendData.detections.length,
      detections: enhancedDetections,
      processing_time: backendData.processing_time,
      alerts
    };
    
    // Add annotated image if requested
    if (include_annotated && 'annotated_image' in backendData) {
      response.annotated_image = backendData.annotated_image;
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Detection processing error:', error);
    return NextResponse.json(
      { error: 'Detection processing failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Simple pig identification (placeholder for marker detection)
async function identifyPigFromDetection(
  detection: BackendDetection, 
  registeredPigs: any[]
): Promise<string | undefined> {
  // In the pilot program, this would:
  // 1. Extract the pig region from the image using bbox coordinates
  // 2. Analyze the image for colored markers (spray paint)
  // 3. Match detected colors to registered pig marker combinations
  
  // For now, return a placeholder based on track_id
  if (registeredPigs.length > 0) {
    const pigIndex = detection.track_id % registeredPigs.length;
    return registeredPigs[pigIndex]?.pigId;
  }
  
  return `UNKNOWN_${detection.track_id}`;
}

// Store detections in database
async function storeDetections(
  camera_id: string, 
  frame_number: number, 
  detections: EnhancedDetection[]
) {
  try {
    const detectionRecords = detections.map(detection => ({
      timestamp: new Date(),
      frameNumber: frame_number,
      cameraId: camera_id,
      pigId: detection.pig_id,
      markerColors: detection.marker_colors || [],
      confidence: detection.confidence,
      bboxX: Math.round(detection.bbox.x),
      bboxY: Math.round(detection.bbox.y),
      bboxWidth: Math.round(detection.bbox.width),
      bboxHeight: Math.round(detection.bbox.height),
      maskArea: detection.mask_area ? Math.round(detection.mask_area) : null,
      posture: detection.posture,
      activity: detection.activity,
      movementDetected: detection.movement_detected || false,
      trackId: detection.track_id
    }));

    await db.insert(pigDetections).values(detectionRecords);
  } catch (error) {
    console.error('Failed to store detections:', error);
    // Don't throw - detection should still work even if DB storage fails
  }
}

// Check for alerts based on detection patterns
async function checkForAlerts(detections: EnhancedDetection[]) {
  const alerts = [];
  
  try {
    // Check for pigs with low confidence (might indicate health issues)
    for (const detection of detections) {
      if (detection.pig_id && detection.confidence < 0.3) {
        // Check if this is a pattern (low confidence in recent detections)
        const recentDetections = await db
          .select()
          .from(pigDetections)
          .where(
            and(
              eq(pigDetections.pigId, detection.pig_id),
              gte(pigDetections.timestamp, new Date(Date.now() - 30 * 60 * 1000)) // Last 30 minutes
            )
          )
          .orderBy(desc(pigDetections.timestamp))
          .limit(10);
        
        const lowConfidenceCount = recentDetections.filter(d => d.confidence < 0.3).length;
        
        if (lowConfidenceCount >= 3) {
          const alert = {
            pig_id: detection.pig_id,
            alert_type: 'detection_quality',
            severity: 'medium',
            message: `Pig ${detection.pig_id} showing poor detection quality - possible obstruction or health concern`,
            evidence: {
              recent_low_confidence: lowConfidenceCount,
              current_confidence: detection.confidence
            }
          };
          
          // Store alert in database
          await db.insert(pigAlerts).values({
            pigId: alert.pig_id,
            alertType: alert.alert_type,
            severity: alert.severity,
            message: alert.message,
            timestamp: new Date(),
            resolved: false,
            movementData: alert.evidence
          });
          
          alerts.push(alert);
        }
      }
    }
  } catch (error) {
    console.error('Alert checking failed:', error);
    // Don't throw - detection should work even if alert checking fails
  }
  
  return alerts;
}