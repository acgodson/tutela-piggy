import React, { RefObject } from 'react';
import { Detection } from '@/types';

interface VideoPlayerProps {
    videoRef: RefObject<HTMLVideoElement>;
    canvasRef: RefObject<HTMLCanvasElement>;
    isStreaming: boolean;
    detections: Detection[];
    expectedPigCount: number;
    stats: {
        fps: number;
        processing_time: number;
    };
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({
    videoRef,
    canvasRef,
    isStreaming,
    detections,
    expectedPigCount,
    stats
}) => {
    return (
        <div className="relative bg-black rounded-xl overflow-hidden aspect-video border border-gray-800">
            <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-contain"
                playsInline
                loop
                muted
            />
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
            />

            {!isStreaming && (
                <div className="absolute inset-0 flex items-center justify-center backdrop-blur-md bg-black/50 rounded-xl">
                    <div className="text-center">
                        <svg className="w-16 h-16 text-gray-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                        <div className="text-gray-400 text-sm font-medium">Camera Inactive</div>
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
    );
};