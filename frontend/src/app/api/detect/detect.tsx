// app/api/detect/route.ts
import { NextRequest, NextResponse } from 'next/server';
import {
    Client,
    TopicId,
    TopicMessageSubmitTransaction,
    PrivateKey,
    AccountId
} from '@hashgraph/sdk';

const API_ENDPOINT = process.env.API_ENDPOINT || 'http://localhost:8002';


let hederaClient: Client | null = null;

function getHederaClient() {
    if (!hederaClient) {
        const operatorId = AccountId.fromString(process.env.HEDERA_ACCOUNT_ID!);
        const operatorKey = PrivateKey.fromString(process.env.HEDERA_PRIVATE_KEY!);

        hederaClient = Client.forTestnet();
        hederaClient.setOperator(operatorId, operatorKey);
    }
    return hederaClient;
}

interface Detection {
    track_id?: number;
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
    class_name: string;
}

interface Alert {
    alert_type: 'count_mismatch' | 'inactivity_alert';
    severity: 'high' | 'medium';
    timestamp: string;
    pig_id?: number;
    expected_count?: number;
    detected_count?: number;
    risk: string;
    action: string;
}

// Track pig positions for inactivity detection
const pigPositionHistory = new Map<number, Array<{ x: number; y: number; timestamp: number }>>();
const lastAlertTime = new Map<string, number>();

function detectAlerts(detections: Detection[], expectedCount: number): Alert[] {
    const alerts: Alert[] = [];
    const currentTime = Date.now();

    // ALERT 1: COUNT MISMATCH
    if (detections.length !== expectedCount) {
        const alertKey = 'count_mismatch';
        const lastAlert = lastAlertTime.get(alertKey) || 0;

        // Cooldown: 30 seconds between same alert
        if (currentTime - lastAlert > 30000) {
            alerts.push({
                alert_type: 'count_mismatch',
                severity: 'high',
                timestamp: new Date().toISOString(),
                expected_count: expectedCount,
                detected_count: detections.length,
                risk: detections.length < expectedCount
                    ? 'Missing pig - possibly sick and hiding'
                    : 'Extra pig detected - unauthorized entry',
                action: 'Perform physical headcount immediately'
            });
            lastAlertTime.set(alertKey, currentTime);
        }
    }

    // ALERT 2: INACTIVITY
    // Track each pig's position
    detections.forEach(detection => {
        const trackId = detection.track_id;
        if (!trackId) return;

        const centerX = detection.x + detection.width / 2;
        const centerY = detection.y + detection.height / 2;

        // Initialize or update position history
        if (!pigPositionHistory.has(trackId)) {
            pigPositionHistory.set(trackId, []);
        }

        const history = pigPositionHistory.get(trackId)!;
        history.push({ x: centerX, y: centerY, timestamp: currentTime });

        // Keep only last 15 seconds of history
        const recentHistory = history.filter(p => currentTime - p.timestamp < 15000);
        pigPositionHistory.set(trackId, recentHistory);

        // Check for inactivity (need at least 15 seconds of history)
        if (recentHistory.length >= 5) { // Assuming ~3 FPS, 5 frames = 15s
            const firstPos = recentHistory[0];
            const lastPos = recentHistory[recentHistory.length - 1];

            // Calculate movement
            const distance = Math.sqrt(
                Math.pow(lastPos.x - firstPos.x, 2) +
                Math.pow(lastPos.y - firstPos.y, 2)
            );

            // If pig moved less than 50 pixels in 15 seconds = inactive
            if (distance < 50) {
                const alertKey = `inactivity_${trackId}`;
                const lastAlert = lastAlertTime.get(alertKey) || 0;

                // Cooldown: 30 seconds
                if (currentTime - lastAlert > 30000) {
                    alerts.push({
                        alert_type: 'inactivity_alert',
                        severity: 'medium',
                        timestamp: new Date().toISOString(),
                        pig_id: trackId,
                        risk: 'Lethargy detected - possible illness or fever',
                        action: 'Check pig temperature and monitor closely'
                    });
                    lastAlertTime.set(alertKey, currentTime);
                }
            }
        }
    });

    return alerts;
}


async function logToHedera(alert: Alert): Promise<{
    success: boolean;
    topic_id?: string;
    sequence?: number;
    error?: string;
}> {
    try {
        const client = getHederaClient();
        const topicId = TopicId.fromString(process.env.HEDERA_TOPIC_ID!);

        const message = JSON.stringify({
            farm_id: process.env.FARM_ID || 'TUTELA-DEMO-001',
            location: 'Lagos, Nigeria',
            ...alert
        });

        const transaction = new TopicMessageSubmitTransaction()
            .setTopicId(topicId)
            .setMessage(message);

        const response = await transaction.execute(client);
        const receipt = await response.getReceipt(client);

        console.log('✅ Alert logged to Hedera:', alert.alert_type);

        return {
            success: true,
            topic_id: topicId.toString(),
            sequence: Number(receipt.topicSequenceNumber)
        };
    } catch (error) {
        console.error('❌ Hedera logging failed:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { image, frame_id, timestamp, expected_pig_count = 2 } = body;

        // Forward to Python backend for detection
        const response = await fetch(`${API_ENDPOINT}/detect/frame`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ image, frame_id, timestamp }),
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: 'Backend processing failed' },
                { status: response.status }
            );
        }

        const data = await response.json();

        // Detect alerts
        const alerts = detectAlerts(data.detections || [], expected_pig_count);

        // Log alerts to Hedera
        const hederaReceipts = await Promise.all(
            alerts.map(alert => logToHedera(alert))
        );

        // Add alerts to response
        return NextResponse.json({
            ...data,
            alerts,
            alert_count: alerts.length,
            hedera_receipts: hederaReceipts,
            hedera_enabled: true
        });

    } catch (error) {
        console.error('API route error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}


export async function GET() {
    try {
        const response = await fetch(`${API_ENDPOINT}/health`);
        const data = await response.json();

        // Check Hedera connection
        let hederaStatus = 'disabled';
        if (process.env.HEDERA_ACCOUNT_ID && process.env.HEDERA_TOPIC_ID) {
            try {
                getHederaClient();
                hederaStatus = 'connected';
            } catch {
                hederaStatus = 'error';
            }
        }

        return NextResponse.json({
            status: 'ok',
            backend: data,
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