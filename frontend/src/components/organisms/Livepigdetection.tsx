'use client';


import { TabType } from '@/types';
import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { useVideoStream, useDetection, useModals } from '@/hooks/';
import { EmbedModal, AlertsPanel, VideoPlayer, DetectionSidebar } from '@/components/molecules/';


export default function LivePigDetection() {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [activeTab, setActiveTab] = useState<TabType>('live');
    const [expectedPigCount, setExpectedPigCount] = useState(2);

    const {
        videoRef,
        canvasRef,
        isStreaming,
        videoSource,
        startCamera,
        handleVideoUpload,
        stopStreaming,
        getCanvasContext,
        captureFrame
    } = useVideoStream();


    useEffect(() => {
        console.log('isStreaming changed to:', isStreaming);
    }, [isStreaming]);

    useEffect(() => {
        console.log('activeTab changed to:', activeTab);
    }, [activeTab]);

    const {
        detections,
        alerts,
        hederaReceipts,
        stats,
        hederaEnabled
    } = useDetection({
        expectedPigCount,
        captureFrame,
        getCanvasContext,
        isStreaming
    });

    const {
        showEmbedModal,
        openEmbedModal,
        closeEmbedModal,
        showAlertsPanel,
        openAlertsPanel,
        closeAlertsPanel
    } = useModals();

    const onVideoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        console.log('File input changed', e.target.files);
        const file = e.target.files?.[0];
        if (file) {
            console.log('File selected:', file.name, file.type, file.size);
            const result = handleVideoUpload(file);
            console.log('handleVideoUpload returned:', result);
        } else {
            console.log('No file selected');
        }
    };

    return (
        <>
            <div className="h-full text-white">
                <div className="max-w-7xl mx-auto p-3 sm:p-4 h-full flex flex-col">
                    <div className="mb-3 sm:mb-4 flex-shrink-0">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                            <div>

                                <div className="flex items-center gap-2">
                                    <Image
                                        src="/logo.jpg"
                                        alt="Tutela Logo"
                                        width={32}
                                        height={32}
                                        className="object-contain rounded"
                                        priority
                                    />
                                    <div className="relative w-8 h-8 flex-shrink-0">
                                        <h1 className="text-lg sm:text-xl font-bold text-white">Tutela</h1>
                                    </div>
                                </div>

                                <p className="text-gray-400 text-xs mt-1.5">AI Pig Monitor Demo</p>
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <button
                                    onClick={openAlertsPanel}
                                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white rounded-lg transition text-xs font-medium"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                    </svg>
                                    <span className="hidden sm:inline">Alerts</span>
                                </button>
                                <button
                                    onClick={openEmbedModal}
                                    className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-3 py-1.5 bg-gray-900 hover:bg-gray-800 border border-gray-800 text-white rounded-lg transition text-xs font-medium"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                                    </svg>
                                    <span className="hidden sm:inline">Share</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-4 flex-1 min-h-0">
                        <div className="lg:col-span-2 space-y-3 flex flex-col min-h-0">
                            <div className="backdrop-blur-md bg-black/30 border border-white/20 rounded-xl p-1 flex w-full sm:w-auto sm:inline-flex shadow-lg flex-shrink-0">
                                <button
                                    onClick={() => setActiveTab('live')}
                                    className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeTab === 'live'
                                        ? 'bg-gray-800 text-white'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    <span className="flex items-center justify-center gap-1 sm:gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                        </svg>
                                        <span className="hidden sm:inline">Live Camera</span>
                                        <span className="sm:hidden">Live</span>
                                    </span>
                                </button>
                                <button
                                    onClick={() => setActiveTab('upload')}
                                    className={`flex-1 sm:flex-initial px-3 py-1.5 rounded-lg text-xs font-medium transition ${activeTab === 'upload'
                                        ? 'bg-gray-800 text-white'
                                        : 'text-gray-400 hover:text-white'
                                        }`}
                                >
                                    <span className="flex items-center justify-center gap-1 sm:gap-2">
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                        </svg>
                                        <span className="hidden sm:inline">Upload Video</span>
                                        <span className="sm:hidden">Upload</span>
                                    </span>
                                </button>
                            </div>

                            <div className="backdrop-blur-md bg-black/30 border border-white/20 rounded-xl p-2 sm:p-3 shadow-lg flex-shrink-0">
                                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                                    <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
                                        <label className="text-xs font-medium text-gray-300 whitespace-nowrap">
                                            Expected Pig Count:
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            max="10"
                                            value={expectedPigCount}
                                            onChange={(e) => setExpectedPigCount(parseInt(e.target.value) || 2)}
                                            className="w-20 px-2 py-1.5 bg-[#0a0a0a] border border-gray-800 rounded-lg text-white text-xs focus:outline-none focus:border-gray-700"
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

                            {activeTab === 'live' && (
                                <div className="space-y-3 flex-1 flex flex-col min-h-0">
                                    <div className="flex-1 min-h-0">
                                        <VideoPlayer
                                            videoRef={videoRef as React.RefObject<HTMLVideoElement>}
                                            canvasRef={canvasRef as React.RefObject<HTMLCanvasElement>}
                                            isStreaming={isStreaming}
                                            detections={detections}
                                            expectedPigCount={expectedPigCount}
                                            stats={stats}
                                        />
                                    </div>

                                    <div className="flex gap-2 flex-shrink-0">
                                        {!isStreaming ? (
                                            <button
                                                onClick={startCamera}
                                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 rounded-lg transition flex items-center justify-center gap-2 text-sm"
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
                                                className="flex-1 bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-medium py-2 rounded-lg transition flex items-center justify-center gap-2 text-sm"
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
                                <div className="space-y-3 flex-1 flex flex-col min-h-0">
                                    {!isStreaming ? (
                                        <>
                                            {/* Hidden VideoPlayer to ensure refs exist */}
                                            <div className="hidden">
                                                <VideoPlayer
                                                    videoRef={videoRef as React.RefObject<HTMLVideoElement>}
                                                    canvasRef={canvasRef as React.RefObject<HTMLCanvasElement>}
                                                    isStreaming={false}
                                                    detections={[]}
                                                    expectedPigCount={expectedPigCount}
                                                    stats={{ fps: 0, processing_time: 0 }}
                                                />
                                            </div>

                                            <div
                                                onClick={() => fileInputRef.current?.click()}
                                                className="border-2 border-dashed border-white/30 hover:border-white/40 rounded-xl p-12 text-center cursor-pointer transition backdrop-blur-md bg-black/30 shadow-lg flex-1 flex flex-col items-center justify-center"
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
                                                    onChange={onVideoFileSelect}
                                                    className="hidden"
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex-1 min-h-0">
                                                <VideoPlayer
                                                    videoRef={videoRef as React.RefObject<HTMLVideoElement>}
                                                    canvasRef={canvasRef as React.RefObject<HTMLCanvasElement>}
                                                    isStreaming={isStreaming}
                                                    detections={detections}
                                                    expectedPigCount={expectedPigCount}
                                                    stats={stats}
                                                />
                                            </div>

                                            <button
                                                onClick={stopStreaming}
                                                className="w-full bg-gray-800 hover:bg-gray-700 border border-gray-700 text-white font-medium py-2 rounded-lg transition flex items-center justify-center gap-2 text-sm flex-shrink-0"
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

                        <div className="min-h-0 overflow-y-auto">
                            <DetectionSidebar
                                detections={detections}
                                alerts={alerts}
                                hederaEnabled={hederaEnabled}
                                isStreaming={isStreaming}
                                videoSource={videoSource}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <EmbedModal isOpen={showEmbedModal} onClose={closeEmbedModal} />
            <AlertsPanel
                isOpen={showAlertsPanel}
                onClose={closeAlertsPanel}
                alerts={alerts}
                hederaReceipts={hederaReceipts}
                hederaEnabled={hederaEnabled}
            />

        </>
    );
}