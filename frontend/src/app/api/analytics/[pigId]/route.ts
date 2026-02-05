import { NextRequest, NextResponse } from 'next/server';
import { db, pigDetections, pigTracking } from '@/lib/db';
import { eq, gte, sql } from 'drizzle-orm';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ pigId: string }> }
) {
  try {
    const { pigId } = await params;
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '7');

    // Get recent detections for heat map
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const detections = await db
      .select({
        centerX: sql<number>`${pigDetections.bboxX} + ${pigDetections.bboxWidth}/2`,
        centerY: sql<number>`${pigDetections.bboxY} + ${pigDetections.bboxHeight}/2`,
        timestamp: pigDetections.timestamp,
        posture: pigDetections.posture,
        activity: pigDetections.activity,
        movementSpeed: pigDetections.movementSpeed
      })
      .from(pigDetections)
      .where(
        eq(pigDetections.pigId, pigId) && 
        gte(pigDetections.timestamp, startDate)
      )
      .orderBy(pigDetections.timestamp);

    // Get daily tracking summaries
    const trackingSummary = await db
      .select()
      .from(pigTracking)
      .where(
        eq(pigTracking.pigId, pigId) &&
        gte(pigTracking.date, startDate.toISOString().split('T')[0])
      )
      .orderBy(pigTracking.date);

    // Generate heat map data
    const heatMap = generateHeatMap(detections);

    // Calculate movement patterns
    const movementPatterns = analyzeMovementPatterns(detections);

    return NextResponse.json({
      pigId,
      daysAnalyzed: days,
      totalDetections: detections.length,
      heatMap,
      movementPatterns,
      trackingSummary,
      analysisTimestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error generating analytics:', error);
    return NextResponse.json(
      { error: 'Failed to generate analytics' },
      { status: 500 }
    );
  }
}

function generateHeatMap(detections: any[]) {
  const gridSize = 20;
  const heatGrid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(0));
  
  // Assume pen dimensions (would be configurable in production)
  const penWidth = 800;
  const penHeight = 600;

  detections.forEach(detection => {
    const gridX = Math.floor((detection.centerX / penWidth) * gridSize);
    const gridY = Math.floor((detection.centerY / penHeight) * gridSize);
    
    if (gridX >= 0 && gridX < gridSize && gridY >= 0 && gridY < gridSize) {
      heatGrid[gridY][gridX]++;
    }
  });

  // Normalize to 0-100 scale
  const maxValue = Math.max(...heatGrid.flat());
  if (maxValue > 0) {
    heatGrid.forEach(row => {
      row.forEach((cell, index) => {
        row[index] = Math.round((cell / maxValue) * 100);
      });
    });
  }

  return {
    gridSize,
    data: heatGrid,
    maxIntensity: 100
  };
}

function analyzeMovementPatterns(detections: any[]) {
  if (detections.length < 2) {
    return {
      totalDistance: 0,
      averageSpeed: 0,
      activityPeriods: [],
      restingPeriods: []
    };
  }

  let totalDistance = 0;
  const speeds = [];
  const activities = [];

  for (let i = 1; i < detections.length; i++) {
    const prev = detections[i - 1];
    const curr = detections[i];
    
    const distance = Math.sqrt(
      Math.pow(curr.centerX - prev.centerX, 2) + 
      Math.pow(curr.centerY - prev.centerY, 2)
    );
    
    totalDistance += distance;
    speeds.push(distance);
    
    if (curr.activity) {
      activities.push({
        activity: curr.activity,
        timestamp: curr.timestamp,
        speed: distance
      });
    }
  }

  const averageSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;

  return {
    totalDistance: Math.round(totalDistance),
    averageSpeed: Math.round(averageSpeed * 100) / 100,
    activityPeriods: activities.filter(a => ['walking', 'active', 'eating'].includes(a.activity)),
    restingPeriods: activities.filter(a => a.activity === 'resting')
  };
}