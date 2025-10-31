'use client';

import React, { useRef, useState, useEffect } from 'react';

interface Detection {
    x: number;
    y: number;
    width: number;
    height: number;
    confidence: number;
    class_name: string;
    track_id?: number;
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

interface HederaReceipt {
    success: boolean;
    topic_id?: string;
    sequence?: number;
    error?: string;
}

type TabType = 'live' | 'upload';
type VideoSource = 'camera' | 'file';

export default function LivePigDetection() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [activeTab, setActiveTab] = useState<TabType>('live');
    const [videoSource, setVideoSource] = useState<VideoSource>('camera');
    const [isStreaming, setIsStreaming] = useState(false);
    const [detections, setDetections] = useState<Detection[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [hederaReceipts, setHederaReceipts] = useState<HederaReceipt[]>([]);
    const [stats, setStats] = useState({ fps: 0, processing_time: 0 });
    const [expectedPigCount, setExpectedPigCount] = useState(2);
    const [hederaEnabled, setHederaEnabled] = useState(false);
    const [showEmbedModal, setShowEmbedModal] = useState(false);
    const [showAlertsPanel, setShowAlertsPanel] = useState(false);

    const frameIdRef = useRef(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    // Start camera
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 1280, height: 720 }
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
                setIsStreaming(true);
                setVideoSource('camera');
                startDetection();
            }
        } catch (error) {
            console.error('Camera access denied:', error);
            alert('Please allow camera access');
        }
    };

    // Handle video upload
    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !videoRef.current) return;

        const url = URL.createObjectURL(file);
        videoRef.current.src = url;
        videoRef.current.load();
        videoRef.current.onloadedmetadata = () => {
            if (videoRef.current) {
                videoRef.current.play();
                setIsStreaming(true);
                setVideoSource('file');
                startDetection();
            }
        };
    };

    // Stop streaming
    const stopStreaming = () => {
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
        }

        if (videoRef.current?.srcObject) {
            const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
            tracks.forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }

        if (videoRef.current?.src && videoSource === 'file') {
            videoRef.current.pause();
            videoRef.current.src = '';
        }

        setIsStreaming(false);
    };

    // Start detection loop
    const startDetection = () => {
        intervalRef.current = setInterval(async () => {
            if (!videoRef.current || !canvasRef.current) return;

            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            if (!ctx || video.readyState !== video.HAVE_ENOUGH_DATA) return;

            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);

            const imageData = canvas.toDataURL('image/jpeg', 0.8);

            try {
                const response = await fetch('/api/detect', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        image: imageData,
                        frame_id: frameIdRef.current++,
                        timestamp: Date.now() / 1000,
                        expected_pig_count: expectedPigCount
                    })
                });

                const data = await response.json();

                setDetections(data.detections || []);
                setStats({
                    fps: data.fps || 0,
                    processing_time: data.processing_time || 0
                });

                if (data.alerts && data.alerts.length > 0) {
                    setAlerts(prev => [...data.alerts, ...prev].slice(0, 50));
                }

                if (data.hedera_receipts) {
                    setHederaReceipts(prev => [...data.hedera_receipts, ...prev].slice(0, 50));
                }

                if (data.hedera_enabled) {
                    setHederaEnabled(true);
                }

                drawDetections(ctx, data.detections || []);
            } catch (error) {
                console.error('Detection error:', error);
            }
        }, 1000);
    };

    // Draw detections
    const drawDetections = (ctx: CanvasRenderingContext2D, dets: Detection[]) => {
        dets.forEach(det => {
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 3;
            ctx.strokeRect(det.x, det.y, det.width, det.height);

            const label = `#${det.track_id || '?'}`;
            ctx.fillStyle = '#22c55e';
            ctx.fillRect(det.x, det.y - 24, 50, 24);
            ctx.fillStyle = '#000';
            ctx.font = 'bold 14px system-ui';
            ctx.fillText(label, det.x + 6, det.y - 7);
        });
    };

    // Generate embed code
    const generateEmbedCode = () => {
        const topicId = process.env.NEXT_PUBLIC_HEDERA_TOPIC_ID || 'YOUR_TOPIC_ID';
        const farmId = process.env.NEXT_PUBLIC_FARM_ID || 'TUTELA-DEMO-001';
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const embedUrl = `${baseUrl}/embed?topic=${topicId}&farm=${farmId}`;

        return `<iframe
  src="${embedUrl}"
  width="800"
  height="600"
  frameborder="0"
  allow="camera; microphone"
  style="border: 1px solid #e5e7eb; border-radius: 8px;"
></iframe>`;
    };

    // Copy to clipboard
    const copyToClipboard = (text: string, type: string) => {
        navigator.clipboard.writeText(text);
        alert(`${type} copied to clipboard!`);
    };

    // Embed Modal
    const EmbedModal = () => {
        if (!showEmbedModal) return null;

        const embedCode = generateEmbedCode();
        const topicId = process.env.NEXT_PUBLIC_HEDERA_TOPIC_ID || 'YOUR_TOPIC_ID';
        const farmId = process.env.NEXT_PUBLIC_FARM_ID || 'TUTELA-DEMO-001';
        const directUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/embed?topic=${topicId}&farm=${farmId}`;

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-800">
                        <h2 className="text-xl font-semibold text-white">Share & Embed</h2>
                        <button
                            onClick={() => setShowEmbedModal(false)}
                            className="text-gray-400 hover:text-white transition"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="p-6 space-y-6">
                        {/* Direct Link */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Direct Link
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={directUrl}
                                    readOnly
                                    className="flex-1 px-4 py-2.5 bg-[#0a0a0a] border border-gray-700 rounded-lg text-gray-300 text-sm font-mono focus:outline-none focus:border-gray-600"
                                />
                                <button
                                    onClick={() => copyToClipboard(directUrl, 'Link')}
                                    className="px-4 py-2.5 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition text-sm font-medium"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>

                        {/* Embed Code */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Embed Code
                            </label>
                            <div className="relative">
                                <pre className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-4 text-sm text-gray-300 overflow-x-auto font-mono">
                                    {embedCode}
                                </pre>
                                <button
                                    onClick={() => copyToClipboard(embedCode, 'Embed code')}
                                    className="absolute top-3 right-3 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-white rounded text-xs font-medium transition"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>

                        {/* Configuration Info */}
                        <div className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-4">
                            <h3 className="text-sm font-medium text-gray-300 mb-3">Embed Configuration</h3>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Hedera Topic ID:</span>
                                    <span className="text-gray-300 font-mono">{topicId}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Farm ID:</span>
                                    <span className="text-gray-300 font-mono">{farmId}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-400">Location:</span>
                                    <span className="text-gray-300">Lagos, Nigeria</span>
                                </div>
                            </div>
                        </div>

                        {/* Preview */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Preview
                            </label>
                            <div className="bg-[#0a0a0a] border border-gray-700 rounded-lg p-6 text-center">
                                <div className="text-gray-500 text-sm">
                                    Embedded alert feed will display live Hedera blockchain logs
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    // Alerts Panel
    const AlertsPanel = () => {
        if (!showAlertsPanel) return null;

        return (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-800">
                        <div>
                            <h2 className="text-xl font-semibold text-white">Alert System</h2>
                            <p className="text-sm text-gray-400 mt-1">Real-time monitoring with blockchain verification</p>
                        </div>
                        <button
                            onClick={() => setShowAlertsPanel(false)}
                            className="text-gray-400 hover:text-white transition"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-6">
                        {/* Alert Types */}
                        <div>
                            <h3 className="text-sm font-semibold text-white mb-4">Alert Types</h3>
                            <div className="grid gap-4">
                                <div className="bg-[#0a0a0a] border border-red-900/30 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="font-medium text-white">Count Mismatch</h4>
                                                <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-xs rounded-full font-medium">HIGH</span>
                                            </div>
                                            <div className="space-y-1.5 text-sm text-gray-400">
                                                <div><span className="text-gray-500">Trigger:</span> Detected pigs ≠ Expected count</div>
                                                <div><span className="text-gray-500">Risk:</span> Missing pig (sick/hiding) or unauthorized entry</div>
                                                <div><span className="text-gray-500">Action:</span> Perform physical headcount immediately</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-[#0a0a0a] border border-yellow-900/30 rounded-lg p-4">
                                    <div className="flex items-start gap-3">
                                        <div className="w-10 h-10 bg-yellow-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                            <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h4 className="font-medium text-white">Inactivity Alert</h4>
                                                <span className="px-2 py-0.5 bg-yellow-500/10 text-yellow-400 text-xs rounded-full font-medium">MEDIUM</span>
                                            </div>
                                            <div className="space-y-1.5 text-sm text-gray-400">
                                                <div><span className="text-gray-500">Trigger:</span> Pig stationary for 15+ seconds</div>
                                                <div><span className="text-gray-500">Risk:</span> Lethargy - possible illness or fever</div>
                                                <div><span className="text-gray-500">Action:</span> Check temperature, monitor closely</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Alert History */}
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-semibold text-white">Alert History</h3>
                                <span className="text-xs text-gray-500">{alerts.length} total</span>
                            </div>

                            <div className="space-y-2">
                                {alerts.length === 0 ? (
                                    <div className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-8 text-center">
                                        <svg className="w-12 h-12 text-gray-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                        <p className="text-sm text-gray-500">No alerts recorded yet</p>
                                    </div>
                                ) : (
                                    alerts.map((alert, idx) => (
                                        <div
                                            key={idx}
                                            className={`bg-[#0a0a0a] border rounded-lg p-4 ${alert.severity === 'high' ? 'border-red-900/30' : 'border-yellow-900/30'
                                                }`}
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-2 h-2 rounded-full ${alert.severity === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                                                        }`}></div>
                                                    <span className="text-white text-sm font-medium">
                                                        {alert.alert_type === 'count_mismatch' ? 'Count Mismatch' : 'Inactivity Alert'}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-gray-500">
                                                    {new Date(alert.timestamp).toLocaleTimeString()}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-400 mb-1">
                                                {alert.risk}
                                            </div>
                                            {alert.expected_count !== undefined && (
                                                <div className="text-xs text-gray-500">
                                                    Expected: {alert.expected_count} | Detected: {alert.detected_count}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        {/* Hedera Log */}
                        {hederaEnabled && hederaReceipts.length > 0 && (
                            <div>
                                <h3 className="text-sm font-semibold text-white mb-4">Blockchain Verification</h3>
                                <div className="space-y-2">
                                    {hederaReceipts.map((receipt, idx) => (
                                        <div key={idx} className="bg-[#0a0a0a] border border-gray-800 rounded-lg p-3">
                                            {receipt.success ? (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-green-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs text-gray-400">Logged to Hedera</div>
                                                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                                                            Topic: {receipt.topic_id} • Seq: {receipt.sequence}
                                                        </div>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-red-500/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                        </svg>
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="text-xs text-red-400">Failed: {receipt.error}</div>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    };

    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
            stopStreaming();
        };
    }, []);

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white">
            <div className="max-w-7xl mx-auto p-6">
                {/* Header */}
                <div className="mb-8">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-bold text-white mb-1">Tutela Pig Detection</h1>
                            <p className="text-gray-400 text-sm">AI-powered livestock monitoring with blockchain verification</p>
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => setShowAlertsPanel(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white rounded-lg transition text-sm font-medium"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                Alerts
                            </button>
                            <button
                                onClick={() => setShowEmbedModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white rounded-lg transition text-sm font-medium"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                </svg>
                                Share
                            </button>
                        </div>
                    </div>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Main Video Section */}
                    <div className="lg:col-span-2 space-y-4">
                        {/* Video Source Tabs */}
                        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-1 inline-flex">
                            <button
                                onClick={() => setActiveTab('live')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'live'
                                        ? 'bg-gray-800 text-white'
                                        : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                    Live Camera
                                </span>
                            </button>
                            <button
                                onClick={() => setActiveTab('upload')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${activeTab === 'upload'
                                        ? 'bg-gray-800 text-white'
                                        : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                <span className="flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    Upload Video
                                </span>
                            </button>
                        </div>

                        {/* Configuration */}
                        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <label className="text-sm font-medium text-gray-300">
                                        Expected Pig Count:
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="10"
                                        value={expectedPigCount}
                                        onChange={(e) => setExpectedPigCount(parseInt(e.target.value) || 2)}
                                        className="w-20 px-3 py-2 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white text-sm focus:outline-none focus:border-gray-700"
                                        disabled={isStreaming}
                                    />
                                </div>

                                {hederaEnabled && (
                                    <div className="flex items-center gap-2">
                                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                        <span className="text-xs text-gray-400">Hedera Connected</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Video Display */}
                        {activeTab === 'live' && (
                            <div className="space-y-4">
                                <div className="relative bg-black rounded-xl overflow-hidden aspect-video border border-gray-800">
                                    <video
                                        ref={videoRef}
                                        className="absolute inset-0 w-full h-full object-contain"
                                        playsInline
                                    />
                                    <canvas
                                        ref={canvasRef}
                                        className="absolute inset-0 w-full h-full"
                                    />

                                    {!isStreaming && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a0a]">
                                            <div className="text-center">
                                                <svg className="w-16 h-16 text-gray-700 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                                </svg>
                                                <div className="text-gray-500 text-sm">Camera Inactive</div>
                                            </div>
                                        </div>
                                    )}

                                    {isStreaming && (
                                        <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-xs space-y-1.5">
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-400">Detected:</span>
                                                <span className="text-white font-medium">{detections.length}/{expectedPigCount}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-400">FPS:</span>
                                                <span className="text-white font-medium">{stats.fps.toFixed(1)}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-400">Latency:</span>
                                                <span className="text-white font-medium">{(stats.processing_time * 1000).toFixed(0)}ms</span>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex gap-3">
                                    {!isStreaming ? (
                                        <button
                                            onClick={startCamera}
                                            className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            Start Camera
                                        </button>
                                    ) : (
                                        <button
                                            onClick={stopStreaming}
                                            className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                            </svg>
                                            Stop Camera
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'upload' && (
                            <div className="space-y-4">
                                {!isStreaming ? (
                                    <div
                                        onClick={() => fileInputRef.current?.click()}
                                        className="border-2 border-dashed border-gray-800 hover:border-gray-700 rounded-xl p-16 text-center cursor-pointer transition bg-[#1a1a1a]"
                                    >
                                        <svg className="w-16 h-16 text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <div className="text-gray-300 font-medium mb-1">Upload Video</div>
                                        <div className="text-gray-500 text-sm">Click to select a video file (MP4, AVI, MOV)</div>
                                        <input
                                            ref={fileInputRef}
                                            type="file"
                                            accept="video/*"
                                            onChange={handleVideoUpload}
                                            className="hidden"
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div className="relative bg-black rounded-xl overflow-hidden aspect-video border border-gray-800">
                                            <video
                                                ref={videoRef}
                                                className="absolute inset-0 w-full h-full object-contain"
                                                playsInline
                                                loop
                                            />
                                            <canvas
                                                ref={canvasRef}
                                                className="absolute inset-0 w-full h-full"
                                            />

                                            <div className="absolute top-4 left-4 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-2 text-xs space-y-1.5">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-400">Detected:</span>
                                                    <span className="text-white font-medium">{detections.length}/{expectedPigCount}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-400">FPS:</span>
                                                    <span className="text-white font-medium">{stats.fps.toFixed(1)}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <button
                                            onClick={stopStreaming}
                                            className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-medium py-3 rounded-lg transition flex items-center justify-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                                            </svg>
                                            Stop Processing
                                        </button>
                                    </>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Sidebar - Detection Info */}
                    <div className="space-y-4">
                        {/* Active Detections */}
                        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-white mb-3">Active Tracks</h3>
                            {detections.length === 0 ? (
                                <div className="text-center py-8">
                                    <svg className="w-12 h-12 text-gray-700 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-xs text-gray-500">No pigs detected</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {detections.map((det, idx) => (
                                        <div
                                            key={idx}
                                            className="flex items-center justify-between bg-[#0a0a0a] px-3 py-2.5 rounded-lg border border-gray-800"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                                <span className="text-sm text-gray-300 font-medium">
                                                    Pig #{det.track_id || '?'}
                                                </span>
                                            </div>
                                            <span className="text-xs text-green-400 font-medium">
                                                {(det.confidence * 100).toFixed(0)}%
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Recent Alerts */}
                        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-sm font-semibold text-white">Recent Alerts</h3>
                                {alerts.length > 0 && (
                                    <span className="text-xs text-gray-500">{alerts.length}</span>
                                )}
                            </div>
                            {alerts.length === 0 ? (
                                <div className="text-center py-8">
                                    <svg className="w-12 h-12 text-gray-700 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    <p className="text-xs text-gray-500">All clear</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {alerts.slice(0, 5).map((alert, idx) => (
                                        <div
                                            key={idx}
                                            className={`bg-[#0a0a0a] rounded-lg p-3 border ${alert.severity === 'high' ? 'border-red-900/30' : 'border-yellow-900/30'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2 mb-1">
                                                <div className={`w-1.5 h-1.5 rounded-full ${alert.severity === 'high' ? 'bg-red-500' : 'bg-yellow-500'
                                                    }`}></div>
                                                <span className="text-xs text-white font-medium">
                                                    {alert.alert_type === 'count_mismatch' ? 'Count Mismatch' : 'Inactivity'}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {new Date(alert.timestamp).toLocaleTimeString()}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* System Status */}
                        <div className="bg-[#1a1a1a] border border-gray-800 rounded-xl p-4">
                            <h3 className="text-sm font-semibold text-white mb-3">System Status</h3>
                            <div className="space-y-2.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">Detection Model</span>
                                    <span className="flex items-center gap-1.5 text-xs">
                                        <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                                        <span className="text-green-400">Active</span>
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">Hedera Network</span>
                                    <span className="flex items-center gap-1.5 text-xs">
                                        <div className={`w-1.5 h-1.5 rounded-full ${hederaEnabled ? 'bg-green-500' : 'bg-gray-600'}`}></div>
                                        <span className={hederaEnabled ? 'text-green-400' : 'text-gray-500'}>
                                            {hederaEnabled ? 'Connected' : 'Standby'}
                                        </span>
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">Video Source</span>
                                    <span className="text-xs text-gray-300 capitalize">
                                        {isStreaming ? videoSource : 'None'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <EmbedModal />
            <AlertsPanel />
        </div>
    );
}