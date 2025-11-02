import { NextRequest, NextResponse } from 'next/server';
import { createHederaService, HederaService } from '@/services/hedera.service';
import { alertDetectionService } from '@/services/alert-detection.service';
import { backendService } from '@/services/backend.service';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { image, frame_id, timestamp, expected_pig_count = 2 } = body;

        const detectionData = await backendService.detectFrame({
            image,
            frame_id,
            timestamp
        });

        const alerts = alertDetectionService.detectAlerts(
            detectionData.detections || [],
            expected_pig_count
        );

        const hederaService = createHederaService();
        let hederaReceipts: any[] = [];

        if (hederaService && alerts.length > 0) {
            hederaReceipts = await Promise.all(
                alerts.map(alert => hederaService.submitMessage(alert))
            );
        }

        return NextResponse.json({
            ...detectionData,
            alerts,
            alert_count: alerts.length,
            hedera_receipts: hederaReceipts,
            hedera_enabled: !!hederaService
        });

    } catch (error) {
        console.error('API route error:', error);
        return NextResponse.json(
            {
                error: error instanceof Error ? error.message : 'Internal server error'
            },
            { status: 500 }
        );
    }
}

export async function GET() {
    try {
        const backendHealth = await backendService.checkHealth();
        const hederaStatus = await HederaService.checkConnection();

        return NextResponse.json({
            status: 'ok',
            backend: backendHealth,
            hedera: hederaStatus,
            timestamp: new Date().toISOString(),
        });
    } catch (error) {
        return NextResponse.json(
            {
                status: 'error',
                error: 'Cannot connect to backend',
                timestamp: new Date().toISOString(),
            },
            { status: 503 }
        );
    }
}